/**
 * Regression tests for the live-turn guard (open-sse/services/compression/liveTurn.ts).
 *
 * Compression shrinks conversation HISTORY. The message the user just typed is
 * the instruction currently being answered — the one thing the model cannot
 * recover from anywhere else — and no engine used to exempt it. `caveman-rules`
 * defaults to `compressRoles: ["user"]`, so the newest prompt was rewritten on
 * every request; under `ultra` whole spans were elided, turning "torque spec is
 * 4.2 Nm and the review deadline" into "torque spec4.2review deadline" and
 * silently dropping the unit. Users read that as the model forgetting what they
 * had just said.
 *
 * Run: node --import tsx/esm --test tests/unit/compression/live-turn-guard.test.ts
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

import { applyCompressionAsync } from "../../../open-sse/services/compression/strategySelector.ts";
import { registerBuiltinCompressionEngines } from "../../../open-sse/services/compression/index.ts";
import { findLiveTurnIndices } from "../../../open-sse/services/compression/liveTurn.ts";

/** A prompt with values whose meaning depends on characters caveman/ultra strip. */
const LIVE_PROMPT =
  "Given the analysis above, the replacement converter part number is VICOR-BCM6135-XQ7.\n" +
  "Also: the torque spec is 4.2 Nm and the review deadline is 2026-09-14.\n" +
  "Reply with ONLY the part number.";

function makeConversation(final = { role: "user", content: LIVE_PROMPT }) {
  const messages: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 40; i++) {
    messages.push({ role: "user", content: `Round ${i}.\n` + "routing and grounding detail. ".repeat(120) });
    messages.push({ role: "assistant", content: `Ack ${i}. ` + "Restating the converter analysis. ".repeat(120) });
  }
  messages.push(final);
  return { model: "gpt-4", messages };
}

describe("live-turn guard — the user's newest instruction is never rewritten", () => {
  before(() => {
    registerBuiltinCompressionEngines();
  });

  for (const mode of ["stacked", "aggressive", "ultra"] as const) {
    it(`${mode}: delivers the live turn verbatim while still compressing history`, async () => {
      const body = makeConversation();
      const originalSize = JSON.stringify(body).length;
      const result = await applyCompressionAsync(
        structuredClone(body) as Record<string, unknown>,
        mode as never,
        {}
      );

      const messages = result.body.messages as Array<{ role: string; content: string }>;
      const delivered = messages[messages.length - 1].content;

      assert.equal(
        delivered,
        LIVE_PROMPT,
        `${mode} rewrote the user's live instruction. Delivered: ${JSON.stringify(delivered)}`
      );
      assert.ok(
        JSON.stringify(result.body).length < originalSize,
        "history must still be compressed — the guard is scoped to the live turn"
      );
    });
  }

  it("ultra no longer welds values together when a span is elided", async () => {
    const result = await applyCompressionAsync(
      structuredClone(makeConversation()) as Record<string, unknown>,
      "ultra" as never,
      {}
    );
    const messages = result.body.messages as Array<{ role: string; content: string }>;
    const delivered = messages[messages.length - 1].content;

    assert.ok(delivered.includes("4.2 Nm"), "the unit must survive alongside its value");
    assert.ok(!/spec4\.2/.test(delivered), "words must not fuse across an elided span");
  });

  it("reported savings reflect what actually left the gateway", async () => {
    // History that compresses to (almost) nothing, so most of any claimed saving
    // would have to come from rewriting the live turn — which is given back.
    const body = {
      model: "gpt-4",
      messages: [
        { role: "user", content: "ok" },
        { role: "assistant", content: "ok" },
        { role: "user", content: LIVE_PROMPT.repeat(20) },
      ],
    };
    const result = await applyCompressionAsync(
      structuredClone(body) as Record<string, unknown>,
      "ultra" as never,
      {}
    );

    const messages = result.body.messages as Array<{ role: string; content: string }>;
    assert.equal(
      messages[messages.length - 1].content,
      LIVE_PROMPT.repeat(20),
      "the live turn must be given back verbatim"
    );
    if (result.compressed) {
      assert.ok(
        result.stats!.compressedTokens < result.stats!.originalTokens,
        "a run reported as compressed must show a real reduction after the restore"
      );
    }
  });

  it("a lone prompt with no history stays compressible (documented scope limit)", async () => {
    // Nothing sits behind it, so there is no history to compress instead — the
    // caller enabling compression is asking for this payload to shrink.
    const body = { model: "gpt-4", messages: [{ role: "user", content: LIVE_PROMPT.repeat(20) }] };
    const result = await applyCompressionAsync(
      structuredClone(body) as Record<string, unknown>,
      "ultra" as never,
      {}
    );
    assert.equal(result.compressed, true, "single-turn requests must still compress");
  });
});

describe("live-turn boundary detection", () => {
  it("covers a trailing run of user messages", () => {
    const messages = [
      { role: "user", content: "first" },
      { role: "assistant", content: "reply" },
      { role: "user", content: "a" },
      { role: "user", content: "b" },
    ];
    assert.deepEqual(findLiveTurnIndices(messages), [2, 3]);
  });

  it("stops at the last assistant turn", () => {
    const messages = [
      { role: "user", content: "old" },
      { role: "assistant", content: "reply" },
      { role: "user", content: "live" },
    ];
    assert.deepEqual(findLiveTurnIndices(messages), [2]);
  });

  it("is empty when the conversation ends on an assistant turn (prefill)", () => {
    const messages = [
      { role: "user", content: "q" },
      { role: "assistant", content: "partial answer" },
    ];
    assert.deepEqual(findLiveTurnIndices(messages), []);
  });

  it("does NOT protect tool output riding in a user envelope", () => {
    // Anthropic ships tool_result blocks inside role:"user"; that is tool output,
    // not something the user typed, and RTK is meant to compress it.
    const messages = [
      { role: "assistant", content: "calling a tool" },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "big output" }] },
    ];
    assert.deepEqual(findLiveTurnIndices(messages), []);
  });

  it("protects a real instruction sent alongside tool results", () => {
    const messages = [
      { role: "assistant", content: "calling a tool" },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "out" }] },
      { role: "user", content: "now do the next thing" },
    ];
    assert.deepEqual(findLiveTurnIndices(messages), [2]);
  });
});
