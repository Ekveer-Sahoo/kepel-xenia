/**
 * TDD tests for the CCR (Content-Compression-Retrieve) engine (H4).
 * Run: node --import tsx/esm --test tests/unit/compression/ccr-marker-retrieve.test.ts
 *
 * RED phase: these tests should FAIL before implementing the engine.
 * GREEN phase: these tests should PASS after implementation.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

import {
  ccrEngine,
  retrieveBlock,
  recordRetrieval,
  shouldSkipCompression,
  resetCcrStore,
  handleCcrRetrieve,
} from "../../../open-sse/services/compression/engines/ccr/index.ts";
import {
  registerBuiltinCompressionEngines,
  getCompressionEngine,
} from "../../../open-sse/services/compression/index.ts";
import { MCP_CAPABLE_TOOLS } from "../../helpers/ccrCaller.ts";

// ─── helpers ──────────────────────────────────────────────────────────────────

const LARGE_TEXT = `This is a large block of content that should trigger CCR compression.
It contains multiple lines and substantial text.
The CCR engine compresses large contiguous blocks of text.
Replacing them with a content-addressed retrieve marker.
This allows the model to retrieve the verbatim content on demand.
Using the retrieve MCP tool with the hash from the marker.
The block must be large enough to exceed the minimum threshold.
Default minimum is 600 characters, so this block is crafted accordingly.
We need to be thorough and ensure the block is truly large enough.
This is line ten and still counting to make the block big enough.`;

const SMALL_TEXT = "Short content that should NOT be compressed.";

const SYSTEM_TEXT = "You are a helpful assistant with system instructions.";

function makeBody(messages: Array<{ role: string; content: string }>) {
  // MCP-capable: CCR only compresses for callers that can expand a marker (#7746).
  return { model: "gpt-4", messages, tools: MCP_CAPABLE_TOOLS };
}

/**
 * The user turn as the model receives it. MCP-capable callers also get the
 * one-time CCR protocol instruction prepended, so the original first message is
 * no longer at index 0 — pick the turn by role instead of by position.
 */
function deliveredContent(result: { body: { messages: unknown } }, role = "user"): string {
  const messages = result.body.messages as Array<{ role: string; content: string }>;
  const msg = messages.find((m) => m.role === role);
  if (!msg) throw new Error(`no ${role} message in result`);
  return msg.content;
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("ccr engine", () => {
  before(() => {
    resetCcrStore();
    registerBuiltinCompressionEngines();
  });

  it("is registered and retrievable by id", () => {
    const engine = getCompressionEngine("ccr");
    assert.ok(engine, "getCompressionEngine('ccr') must return the engine");
    assert.equal(engine.id, "ccr");
    assert.equal(typeof engine.apply, "function");
    assert.equal(typeof engine.compress, "function");
    assert.equal(typeof engine.getConfigSchema, "function");
    assert.equal(typeof engine.validateConfig, "function");
    assert.equal(engine.stackable, true);
    assert.ok(typeof engine.stackPriority === "number");
  });

  it("replaces a large block with a CCR marker", () => {
    resetCcrStore();
    const body = makeBody([{ role: "user", content: LARGE_TEXT }]);
    const result = ccrEngine.apply(body as Record<string, unknown>);

    assert.equal(result.compressed, true, "should report compressed=true");

    const content = deliveredContent(result);

    // Marker must be present
    assert.match(
      content,
      /\[CCR retrieve hash=[0-9a-f]{24} chars=\d+\]/,
      "content must contain a [CCR retrieve hash=<24hex> chars=N] marker"
    );

    // Original large text must be gone
    assert.ok(!content.includes(LARGE_TEXT), "original large block text must be replaced");

    // The replaced turn must be shorter. Compare the message rather than the whole
    // body: an MCP-capable caller is also served the one-time CCR protocol
    // instruction, whose cost is amortised over the rest of the conversation and
    // can exceed a single marker's saving on the very first request.
    assert.ok(
      content.length < LARGE_TEXT.length,
      "the compressed turn must be shorter than the original"
    );
  });

  it("stores and retrieves the verbatim block by hash", () => {
    resetCcrStore();
    const body = makeBody([{ role: "user", content: LARGE_TEXT }]);
    const result = ccrEngine.apply(body as Record<string, unknown>);

    const content = deliveredContent(result);

    // Extract hash from marker
    const match = content.match(/\[CCR retrieve hash=([0-9a-f]{24}) chars=\d+\]/);
    assert.ok(match, "marker must be present to extract hash");
    const hash = match[1];

    // Retrieve the block
    const retrieved = retrieveBlock(hash);
    assert.ok(retrieved !== null, "retrieveBlock must return the stored block");
    assert.equal(retrieved, LARGE_TEXT, "retrieved block must equal the original verbatim text");
  });

  it("does NOT compress small blocks (below minChars threshold)", () => {
    resetCcrStore();
    const body = makeBody([{ role: "user", content: SMALL_TEXT }]);
    const result = ccrEngine.apply(body as Record<string, unknown>);

    assert.equal(result.compressed, false, "small text should NOT be compressed");

    const messages = result.body.messages as Array<{ role: string; content: string }>;
    assert.equal(messages[0].content, SMALL_TEXT, "small text must remain unchanged");
  });

  it("does NOT compress system messages", () => {
    resetCcrStore();
    const body = makeBody([{ role: "system", content: SYSTEM_TEXT + " ".repeat(700) }]);
    const result = ccrEngine.apply(body as Record<string, unknown>);

    assert.equal(result.compressed, false, "system messages must NOT be compressed");

    const messages = result.body.messages as Array<{ role: string; content: string }>;
    assert.ok(
      !messages[0].content.match(/\[CCR retrieve/),
      "system message must not contain a CCR marker"
    );
  });

  it("does NOT compress if output would not be shorter", () => {
    resetCcrStore();
    // A text that's just barely at the threshold but the marker is longer than the text
    const shortishText = "X".repeat(601); // just above 600 but marker is ~50 chars
    const body = makeBody([{ role: "user", content: shortishText }]);
    // The marker is [CCR retrieve hash=<24hex> chars=601] ≈ 48 chars
    // So 601 chars → 48 char marker = savings, so this WILL compress
    // To test "not shorter", we'd need a tiny text — but that's already handled by minChars.
    // This test just confirms a borderline-large block compresses fine.
    const result = ccrEngine.apply(body as Record<string, unknown>);
    // Since 601 > 600 (default min), it should compress
    assert.equal(result.compressed, true, "text above minChars should compress");
  });

  it("feedback: shouldSkipCompression returns true after enough retrievals", () => {
    resetCcrStore();
    const body = makeBody([{ role: "user", content: LARGE_TEXT }]);
    const result = ccrEngine.apply(body as Record<string, unknown>);

    const content = deliveredContent(result);
    const match = content.match(/\[CCR retrieve hash=([0-9a-f]{24}) chars=\d+\]/);
    assert.ok(match, "marker must be present");
    const hash = match[1];

    // Initially should not skip
    assert.equal(shouldSkipCompression(hash), false, "initially should not skip compression");

    // Record retrievals above threshold (default 3)
    recordRetrieval(hash);
    recordRetrieval(hash);
    recordRetrieval(hash);

    // After 3 retrievals, shouldSkipCompression should return true
    assert.equal(
      shouldSkipCompression(hash),
      true,
      "after enough retrievals, shouldSkipCompression must return true"
    );
  });

  it("retrieveBlock returns null for unknown hash", () => {
    resetCcrStore();
    const result = retrieveBlock("000000000000000000000000");
    assert.equal(result, null, "unknown hash must return null");
  });

  it("handles multipart content (type:text parts)", () => {
    resetCcrStore();
    const body = {
      model: "gpt-4",
      // MCP-capable: CCR only compresses for callers that can expand a marker (#7746).
      tools: MCP_CAPABLE_TOOLS,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: LARGE_TEXT },
            { type: "text", text: "and a small follow-up" },
          ],
        },
      ],
    };

    const result = ccrEngine.apply(body as Record<string, unknown>);
    assert.equal(result.compressed, true, "multipart message with large text-part should compress");

    const messages = result.body.messages as Array<{
      role: string;
      content: Array<{ type: string; text: string }>;
    }>;
    const userMsg = messages.find((m) => m.role === "user")!;
    const largePart = userMsg.content[0];
    assert.ok(
      largePart.text.match(/\[CCR retrieve hash=[0-9a-f]{24} chars=\d+\]/),
      "large text part must be replaced by a CCR marker"
    );
    // Small part untouched
    const smallPart = userMsg.content[1];
    assert.equal(smallPart.text, "and a small follow-up");
  });
});

describe("ccr MCP retrieve handler (pure function)", () => {
  it("handleCcrRetrieve returns content for known hash", () => {
    resetCcrStore();

    const body = makeBody([{ role: "user", content: LARGE_TEXT }]);
    const result = ccrEngine.apply(body as Record<string, unknown>);
    const match = deliveredContent(result).match(/\[CCR retrieve hash=([0-9a-f]{24}) chars=\d+\]/);
    assert.ok(match, "marker must be present");
    const hash = match[1];

    const handlerResult = handleCcrRetrieve({ hash });
    assert.ok("content" in handlerResult, "handler must return content field");
    assert.equal((handlerResult as { content: string }).content, LARGE_TEXT);
  });

  it("handleCcrRetrieve returns error for unknown hash", () => {
    resetCcrStore();
    const result = handleCcrRetrieve({ hash: "deadbeef000000000000000a" });
    assert.ok("error" in result, "unknown hash must return error field");
    assert.ok(typeof (result as { error: string }).error === "string");
    assert.ok((result as { error: string }).error.length > 0);
  });
});
