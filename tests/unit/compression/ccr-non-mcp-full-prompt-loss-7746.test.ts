// Regression test for issue #7746.
//
// The CCR ("Content-Compression-Retrieve") engine can replace an ENTIRE
// single-message user prompt with nothing but a bare
// `[CCR retrieve hash=... chars=N]` marker. The MCP tool that could expand
// that marker (`xenia_ccr_retrieve`) is only ever exposed through
// Xenia's own MCP server — never injected into the `tools` array of a
// plain /v1/chat/completions OpenAI-compatible request. So for non-MCP
// clients (OpenCode, Claude Code in "openai-compatible" mode, or any generic
// proxy client), once a large first-turn prompt is compressed, the original
// text becomes permanently unreachable from the model's point of view.
//
// The first fix kept a 200-char preamble in front of the marker. That satisfied
// "not a bare marker" without fixing the loss: a prompt carrying several
// distinct instructions still reached the model with only the first one intact,
// truncated mid-sentence, and the model had no way to tell that the remainder
// had ever existed. CCR now skips non-MCP callers entirely, which is what these
// assertions pin down.
//
// Run: node --import tsx/esm --test tests/unit/compression/ccr-non-mcp-full-prompt-loss-7746.test.ts
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  ccrEngine,
  resetCcrStore,
  retrieveBlock,
} from "../../../open-sse/services/compression/engines/ccr/index.ts";

// The reporter's actual Playwright-automation prompt, sent as the sole
// message of a brand-new conversation (no prior turns, no `tools` array) —
// the shape of a plain OpenAI-compatible request from OpenCode/Claude Code.
const REPORTER_PROMPT = `I want you to build a Playwright automation script for AgentRouter with the following requirements.

The script must:
1. Launch a Chromium browser instance using Playwright's async API, with headless mode configurable via an environment variable.
2. Navigate to the AgentRouter dashboard login page and authenticate using credentials pulled from environment variables (never hard-coded).
3. Wait for the dashboard to fully load, verified by checking for a specific selector that only appears once the page is interactive.
4. Navigate to the "Providers" section and enumerate every configured provider row, extracting the provider name, status (enabled/disabled), and current rate-limit usage percentage.
5. For any provider whose rate-limit usage exceeds 90%, click into its detail panel and capture a full-page screenshot, saving it to a timestamped file under a "reports/" directory that the script creates if missing.
6. Aggregate all extracted data into a single JSON report with a top-level "generatedAt" ISO timestamp and a "providers" array of objects.
7. Write the JSON report to disk with pretty-printing (2-space indent) and also log a concise summary table to stdout using console.table.
8. Implement robust error handling: if navigation or a selector wait times out, retry up to 3 times with exponential backoff before failing the whole run with a clear error message and non-zero exit code.
9. Add a cleanup step in a try/finally block that always closes the browser context and browser instance, even if an assertion or navigation step throws.
10. Structure the code into clearly separated functions (login, scrapeProviders, screenshotOverLimit, writeReport) rather than one long monolithic script, and add JSDoc comments explaining each function's parameters and return value.
11. Make the script runnable both as a standalone Node script (via a shebang and direct invocation) and importable as a module for reuse in a larger test suite.
12. Include a small README-style comment block at the top of the file explaining prerequisites (Node version, Playwright install command) and how to run the script with the required environment variables.

Please keep the code idiomatic modern JavaScript/TypeScript, avoid unnecessary external dependencies beyond Playwright itself, and make sure timeouts and selectors are configurable constants at the top of the file rather than magic numbers scattered through the logic. Generate production-quality code that is easy to maintain and extend.`;

function makeOpenCodeStyleRequestBody() {
  return {
    model: "hy-3:free",
    messages: [{ role: "user", content: REPORTER_PROMPT }],
    stream: true,
  };
}

describe("issue #7746 — CCR must not reduce the sole user prompt to a bare, unretrievable marker", () => {
  before(() => {
    resetCcrStore();
  });

  it("prompt fixture is realistically sized (>= default 600-char minChars)", () => {
    assert.ok(
      REPORTER_PROMPT.length >= 600,
      `fixture must be >= 600 chars, got ${REPORTER_PROMPT.length}`
    );
  });

  it("does not compress at all when the caller cannot resolve the retrieve tool", () => {
    resetCcrStore();
    const body = makeOpenCodeStyleRequestBody();
    const result = ccrEngine.apply(body as Record<string, unknown>, { stepConfig: {} });

    assert.equal(
      result.compressed,
      false,
      "BUG #7746: CCR compressed a prompt for a caller with no way to expand the " +
        "resulting marker. The replaced text is unrecoverable from the model's " +
        "point of view, so this is silent data loss, not compression."
    );
  });

  it("delivers the sole user prompt to the model verbatim — no marker, no truncation", () => {
    resetCcrStore();
    const body = makeOpenCodeStyleRequestBody();
    const result = ccrEngine.apply(body as Record<string, unknown>, { stepConfig: {} });

    const messages = result.body.messages as Array<{ role: string; content: string }>;
    const delivered = messages[0].content;

    assert.equal(
      delivered,
      REPORTER_PROMPT,
      "the non-MCP caller's prompt must reach the model exactly as sent"
    );
    assert.ok(
      !delivered.includes("[CCR retrieve"),
      `no CCR marker may appear. Got: ${JSON.stringify(delivered.slice(-120))}`
    );
  });

  it("instructions past the preamble cutoff are not dropped", () => {
    // The reported symptom: a prompt of several numbered instructions arrived
    // with only the first intact, cut mid-sentence. Assert on content the old
    // 200-char preamble guard would have discarded.
    resetCcrStore();
    const body = makeOpenCodeStyleRequestBody();
    const result = ccrEngine.apply(body as Record<string, unknown>, { stepConfig: {} });

    const messages = result.body.messages as Array<{ role: string; content: string }>;
    const delivered = messages[0].content;

    for (const n of [2, 7, 12]) {
      assert.ok(
        delivered.includes(`\n${n}. `),
        `instruction ${n} must survive — it sits past the 200-char preamble cutoff`
      );
    }
  });

  it("an MCP-capable caller still gets compression, with the original retrievable", () => {
    resetCcrStore();
    const body = {
      ...makeOpenCodeStyleRequestBody(),
      tools: [{ type: "function", function: { name: "xenia_ccr_retrieve" } }],
    };
    const result = ccrEngine.apply(body as Record<string, unknown>, { stepConfig: {} });

    assert.equal(result.compressed, true, "MCP-capable callers must still benefit from CCR");

    // Match on a concrete hash — the injected protocol instruction also mentions
    // the marker format, so a bare "[CCR retrieve" substring finds that instead.
    const MARKER = /\[CCR retrieve hash=([0-9a-f]{24}) chars=\d+\]/;
    const messages = result.body.messages as Array<{ role: string; content: string }>;
    const hit = messages.map((m) => MARKER.exec(m.content ?? "")).find(Boolean);
    assert.ok(hit, "an MCP-capable caller should receive a marker");
    const hash = hit![1];
    assert.equal(
      retrieveBlock(hash),
      REPORTER_PROMPT,
      "original prompt must be stored verbatim and retrievable"
    );
  });
});
