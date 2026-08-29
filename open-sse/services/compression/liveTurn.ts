/**
 * Live-turn guard.
 *
 * Compression exists to shrink CONVERSATION HISTORY. The message the user just
 * typed is not history — it is the instruction currently being answered, and it
 * is the one piece of context the model cannot recover from anywhere else.
 *
 * Nothing in the pipeline used to protect it. `caveman-rules` in particular
 * takes `compressRoles: ["user"]` by default, so the newest prompt was rewritten
 * on every request: articles and connectives deleted, and under `ultra` whole
 * spans elided ("torque spec is 4.2 Nm and the review deadline" → "torque
 * spec4.2review deadline", silently dropping the unit). Users read that as the
 * model ignoring or forgetting what they had just said.
 *
 * The guard runs at the compression entrypoint, outside every engine and mode,
 * so no individual engine has to opt in and none can bypass it. Engines still
 * SEE the live turn — they need it for context (dedup first-occurrence, tool
 * call lookup, relevance scoring) — but any edit they make to it is reverted
 * before the body goes upstream.
 *
 * Scope is deliberately narrow:
 *   - Only the trailing run of user-authored instruction messages. It stops at
 *     the first assistant/system/tool message.
 *   - NOT Anthropic-style `tool_result` blocks riding in a `role: "user"`
 *     envelope — that is tool output, which RTK is meant to compress and which
 *     the user did not write.
 *   - NOT a request with no history behind the live turn (a system prompt does
 *     not count as history). A lone prompt IS the whole payload; compressing it
 *     is the point of enabling compression at all, and the caller opted into
 *     that. The bug this guards against is different in kind: a request that
 *     claims to be compressing HISTORY while quietly rewriting the sentence
 *     just typed.
 */

import { estimateCompressionTokens } from "./stats.ts";
import type { CompressionResult } from "./types.ts";

interface MessageLike {
  role?: unknown;
  content?: unknown;
}

/**
 * True for a `role: "user"` message whose content is purely tool output
 * (Anthropic ships `tool_result` blocks inside a user envelope). Such a message
 * is not something the user typed, so the guard leaves it compressible.
 */
function isToolResultEnvelope(msg: MessageLike): boolean {
  if (!Array.isArray(msg.content)) return false;
  if (msg.content.length === 0) return false;
  return msg.content.every(
    (part) =>
      typeof part === "object" &&
      part !== null &&
      (part as { type?: unknown }).type === "tool_result"
  );
}

/**
 * Indices of the messages forming the live turn: the trailing run of
 * user-authored instruction messages.
 *
 * Empty when there is nothing to guard — a conversation ending on an assistant
 * turn (prefill), one ending in tool output, or one with no history behind the
 * live turn (see the module docstring on why a lone prompt stays compressible).
 */
export function findLiveTurnIndices(messages: readonly unknown[]): number[] {
  const indices: number[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as MessageLike | null;
    if (!msg || typeof msg !== "object") break;
    if (msg.role !== "user") break;
    if (isToolResultEnvelope(msg)) break;
    indices.push(i);
  }
  // "History" means an actual prior exchange. A system prompt is configuration,
  // not conversation, so `[system, user]` is still a lone prompt: with nothing
  // else to compress, the payload IS the live turn and stays compressible.
  const hasHistory = messages
    .slice(0, messages.length - indices.length)
    .some((msg) => (msg as MessageLike | null)?.role !== "system");
  if (!hasHistory) return [];
  return indices.reverse();
}

/**
 * Run `compress`, then restore the live turn verbatim from the input body.
 *
 * Savings are recomputed after the restore so analytics report what was actually
 * sent upstream rather than what the engines would have sent. A run whose only
 * "saving" came from rewriting the live turn correctly collapses to
 * `compressed: false`.
 */
export function withLiveTurnGuard(
  body: Record<string, unknown>,
  compress: (body: Record<string, unknown>) => CompressionResult
): CompressionResult {
  const original = body["messages"];
  if (!Array.isArray(original)) return compress(body);

  const liveTurn = findLiveTurnIndices(original);
  if (liveTurn.length === 0) return compress(body);

  const preserved = new Map(liveTurn.map((i) => [i, original[i]]));
  return restoreLiveTurn(compress(body), preserved, original.length);
}

/** Async twin of {@link withLiveTurnGuard}. */
export async function withLiveTurnGuardAsync(
  body: Record<string, unknown>,
  compress: (body: Record<string, unknown>) => Promise<CompressionResult>
): Promise<CompressionResult> {
  const original = body["messages"];
  if (!Array.isArray(original)) return compress(body);

  const liveTurn = findLiveTurnIndices(original);
  if (liveTurn.length === 0) return compress(body);

  const preserved = new Map(liveTurn.map((i) => [i, original[i]]));
  return restoreLiveTurn(await compress(body), preserved, original.length);
}

function restoreLiveTurn(
  result: CompressionResult,
  preserved: Map<number, unknown>,
  originalLength: number
): CompressionResult {
  if (!result.compressed) return result;

  const compressedMessages = (result.body as Record<string, unknown>)["messages"];
  if (!Array.isArray(compressedMessages)) return result;

  // Engines may prepend messages (CCR injects a protocol instruction), which
  // shifts every original index by the same amount. Anything other than a
  // clean prepend means indices can no longer be mapped safely, so leave the
  // result untouched rather than restoring over the wrong message.
  const offset = compressedMessages.length - originalLength;
  if (offset < 0) return result;

  let changed = false;
  const restored = compressedMessages.slice();
  for (const [index, message] of preserved) {
    const target = index + offset;
    if (target < 0 || target >= restored.length) return result;
    if (restored[target] === message) continue;
    restored[target] = message;
    changed = true;
  }
  if (!changed) return result;

  const newBody = { ...(result.body as Record<string, unknown>), messages: restored };

  // Recompute the saving against what is actually leaving the gateway.
  const stats = result.stats;
  if (!stats) return { ...result, body: newBody };

  const compressedTokens = estimateCompressionTokens(newBody);
  const saved = stats.originalTokens - compressedTokens;
  if (saved <= 0) {
    return { body: newBody, compressed: false, stats: null };
  }

  return {
    body: newBody,
    compressed: true,
    stats: {
      ...stats,
      compressedTokens,
      savingsPercent: Math.round((saved / stats.originalTokens) * 1000) / 10,
    },
  };
}
