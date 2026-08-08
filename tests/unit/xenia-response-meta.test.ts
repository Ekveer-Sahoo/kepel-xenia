import test from "node:test";
import assert from "node:assert/strict";

import {
  attachXeniaMetaHeaders,
  buildXeniaResponseMetaHeaders,
  buildXeniaSseMetadataComment,
  formatXeniaCost,
  getXeniaTokenCounts,
} from "../../src/domain/xeniaResponseMeta.ts";
import { APP_CONFIG } from "../../src/shared/constants/appConfig.ts";
import { XENIA_RESPONSE_HEADERS } from "../../src/shared/constants/headers.ts";

test("getXeniaTokenCounts normalizes common usage shapes", () => {
  assert.deepEqual(
    getXeniaTokenCounts({
      prompt_tokens: 12,
      completion_tokens: 5,
    }),
    { input: 12, output: 5 }
  );
  assert.deepEqual(
    getXeniaTokenCounts({
      input_tokens: "9",
      output_tokens: "4",
    }),
    { input: 9, output: 4 }
  );
});

test("buildXeniaResponseMetaHeaders formats provider alias, tokens, latency, and cost", () => {
  const headers = buildXeniaResponseMetaHeaders({
    provider: "claude",
    model: "claude-sonnet-4-6",
    cacheHit: true,
    latencyMs: 1234.6,
    usage: {
      prompt_tokens: 11,
      completion_tokens: 7,
    },
    costUsd: 0.00123456789,
  });

  assert.equal(headers["X-Xenia-Provider"], "cc");
  assert.equal(headers["X-Xenia-Model"], "claude-sonnet-4-6");
  assert.equal(headers["X-Xenia-Cache-Hit"], "true");
  assert.equal(headers["X-Xenia-Latency-Ms"], "1235");
  assert.equal(headers["X-Xenia-Tokens-In"], "11");
  assert.equal(headers["X-Xenia-Tokens-Out"], "7");
  assert.equal(headers["X-Xenia-Response-Cost"], "0.0012345679");
});

test("buildXeniaResponseMetaHeaders keeps ASCII model header values unchanged", () => {
  const headers = buildXeniaResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  assert.equal(headers[XENIA_RESPONSE_HEADERS.model], "gpt-4o-mini");
});

test("buildXeniaResponseMetaHeaders percent-encodes non-ASCII model header values", () => {
  const model = "free-mix/[假流式]gemini-3.5-flash";
  const headers = buildXeniaResponseMetaHeaders({
    provider: "openai",
    model,
  });

  assert.equal(headers[XENIA_RESPONSE_HEADERS.model], encodeURIComponent(model));
  assert.doesNotThrow(() => new Headers(headers));
});

test("buildXeniaResponseMetaHeaders strips control characters from string header values", () => {
  const headers = buildXeniaResponseMetaHeaders({
    provider: "openai",
    model: "free\r\nX-Injected: yes\u0000-model",
    requestId: "req-1\nreq-2\rreq-3\u0007",
  });

  assert.doesNotMatch(headers[XENIA_RESPONSE_HEADERS.model], /[\r\n\u0000-\u001f\u007f]/);
  assert.doesNotMatch(headers[XENIA_RESPONSE_HEADERS.requestId], /[\r\n\u0000-\u001f\u007f]/);
  assert.equal(headers[XENIA_RESPONSE_HEADERS.model], "freeX-Injected: yes-model");
  assert.equal(headers[XENIA_RESPONSE_HEADERS.requestId], "req-1req-2req-3");
  assert.doesNotThrow(() => new Headers(headers));
});

test("buildXeniaResponseMetaHeaders always emits X-Xenia-Version", () => {
  const headers = buildXeniaResponseMetaHeaders({ provider: "openai", model: "gpt" });
  assert.equal(headers[XENIA_RESPONSE_HEADERS.version], APP_CONFIG.version);

  // Even with no provider/model at all, the version is still attached.
  const bare = buildXeniaResponseMetaHeaders({});
  assert.equal(bare[XENIA_RESPONSE_HEADERS.version], APP_CONFIG.version);
});

test("buildXeniaResponseMetaHeaders emits X-Xenia-Request-Id only when provided", () => {
  const withId = buildXeniaResponseMetaHeaders({ model: "gpt", requestId: "req-123" });
  assert.equal(withId[XENIA_RESPONSE_HEADERS.requestId], "req-123");

  const noId = buildXeniaResponseMetaHeaders({ model: "gpt" });
  assert.equal(noId[XENIA_RESPONSE_HEADERS.requestId], undefined);

  const nullId = buildXeniaResponseMetaHeaders({ model: "gpt", requestId: null });
  assert.equal(nullId[XENIA_RESPONSE_HEADERS.requestId], undefined);

  const blankId = buildXeniaResponseMetaHeaders({ model: "gpt", requestId: "   " });
  assert.equal(blankId[XENIA_RESPONSE_HEADERS.requestId], undefined);
});

test("attachXeniaMetaHeaders mutates a Headers instance in place, preserving existing entries", () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  attachXeniaMetaHeaders(headers, {
    provider: "openai",
    model: "gpt",
    requestId: "req-abc",
  });

  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get(XENIA_RESPONSE_HEADERS.version), APP_CONFIG.version);
  assert.equal(headers.get(XENIA_RESPONSE_HEADERS.requestId), "req-abc");
  assert.equal(headers.get(XENIA_RESPONSE_HEADERS.model), "gpt");
});

test("attachXeniaMetaHeaders mutates a plain record in place, preserving existing entries", () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  attachXeniaMetaHeaders(headers, {
    provider: "openai",
    model: "gpt",
  });

  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(headers[XENIA_RESPONSE_HEADERS.version], APP_CONFIG.version);
  assert.equal(headers[XENIA_RESPONSE_HEADERS.model], "gpt");
  // No requestId provided → header omitted.
  assert.equal(headers[XENIA_RESPONSE_HEADERS.requestId], undefined);
});

test("buildXeniaSseMetadataComment emits comment lines compatible with SSE", () => {
  const comment = buildXeniaSseMetadataComment({
    provider: "openai",
    model: "gpt-4o-mini",
    usage: {
      prompt_tokens: 4,
      completion_tokens: 2,
    },
    latencyMs: 50,
    costUsd: formatXeniaCost(0),
  });

  assert.match(comment, /^: x-xenia-cache-hit=false/m);
  assert.match(comment, /^: x-xenia-provider=openai/m);
  assert.match(comment, /^: x-xenia-model=gpt-4o-mini/m);
  assert.match(comment, /^: x-xenia-tokens-in=4/m);
  assert.match(comment, /^: x-xenia-tokens-out=2/m);
  assert.match(comment, /^: x-xenia-response-cost=0\.0000000000/m);
});

test("buildXeniaResponseMetaHeaders emits X-Xenia-Cost-Saved only when costSavedUsd is provided", () => {
  // Cache HIT: the incremental cost of serving the hit is 0, but the cache saved the
  // original (would-have-been) cost — surfaced via the Cost-Saved header for analytics.
  const hit = buildXeniaResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o",
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0.0125,
  });
  assert.equal(hit[XENIA_RESPONSE_HEADERS.responseCost], "0.0000000000");
  assert.equal(hit[XENIA_RESPONSE_HEADERS.costSaved], "0.0125000000");

  // A normal response (no costSavedUsd) omits the Cost-Saved header entirely.
  const miss = buildXeniaResponseMetaHeaders({
    provider: "openai",
    model: "gpt-4o",
    costUsd: 0.0125,
  });
  assert.equal(miss[XENIA_RESPONSE_HEADERS.costSaved], undefined);

  // A free-model HIT still emits Cost-Saved (= 0) — it explicitly passed costSavedUsd.
  const freeHit = buildXeniaResponseMetaHeaders({
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0,
  });
  assert.equal(freeHit[XENIA_RESPONSE_HEADERS.costSaved], "0.0000000000");
});

test("attachXeniaMetaHeaders forwards costSavedUsd onto a Headers bag", () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  attachXeniaMetaHeaders(headers, {
    provider: "openai",
    model: "gpt-4o",
    cacheHit: true,
    costUsd: 0,
    costSavedUsd: 0.0125,
  });
  assert.equal(headers.get(XENIA_RESPONSE_HEADERS.responseCost), "0.0000000000");
  assert.equal(headers.get(XENIA_RESPONSE_HEADERS.costSaved), "0.0125000000");
});
