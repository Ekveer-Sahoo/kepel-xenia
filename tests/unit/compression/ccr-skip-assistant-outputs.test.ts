/**
 * TDD test for CCR skip-on-assistant-outputs behavior.
 *
 * Background: a prior assistant turn is replayed as conversation history on
 * every later request. If CCR replaces part of that turn with
 * `[CCR retrieve hash=X chars=Y]`, the model's own earlier answer now trails
 * off into an opaque placeholder. Most callers never get the protocol
 * instruction that explains the marker (see protocolInstruction.ts), so the
 * model just continues from the truncation point or stalls — which reads to
 * the user as an answer that "doesn't complete".
 *
 * Fix: CCR must preserve assistant-role messages verbatim, the same way it
 * already preserves tool-role messages (see ccr-skip-tool-outputs.test.ts).
 *
 * Run: node --import tsx/esm --test tests/unit/compression/ccr-skip-assistant-outputs.test.ts
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

import {
  ccrEngine,
  resetCcrStore,
} from "../../../open-sse/services/compression/engines/ccr/index.ts";

const LARGE_ASSISTANT_TEXT = "A".repeat(2000) + " end of assistant turn.";
const LARGE_USER_TEXT = "B".repeat(2000) + " end of user turn.";

describe("ccr engine — skip assistant outputs", () => {
  before(() => {
    resetCcrStore();
  });

  it("does NOT compress role:assistant messages", () => {
    resetCcrStore();
    const body = {
      messages: [
        { role: "user", content: "short prior question" },
        { role: "assistant", content: LARGE_ASSISTANT_TEXT },
        { role: "user", content: "follow-up question" },
      ],
    };
    const result = ccrEngine.apply(body, { stepConfig: {} });
    const messages = result.body.messages;
    assert.equal(messages[1].content, LARGE_ASSISTANT_TEXT);
    assert.ok(!String(messages[1].content).includes("[CCR retrieve"));
  });

  it("still compresses plain user text — the skip rule is scoped to assistant turns", () => {
    resetCcrStore();
    const body = {
      messages: [{ role: "user", content: LARGE_USER_TEXT }],
    };
    const result = ccrEngine.apply(body, { stepConfig: {} });
    assert.equal(result.compressed, true);
    assert.ok(String(result.body.messages[0].content).includes("[CCR retrieve"));
  });

  it("does NOT compress assistant multipart content (type:text parts)", () => {
    resetCcrStore();
    const body = {
      messages: [
        {
          role: "assistant",
          content: [{ type: "text", text: LARGE_ASSISTANT_TEXT }],
        },
      ],
    };
    const result = ccrEngine.apply(body, { stepConfig: {} });
    const parts = result.body.messages[0].content;
    assert.equal(parts[0].text, LARGE_ASSISTANT_TEXT);
  });
});
