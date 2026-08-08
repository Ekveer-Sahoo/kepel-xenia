import test from "node:test";
import assert from "node:assert/strict";
import { XENIA_RESPONSE_HEADERS } from "../../src/shared/constants/headers.ts";
import { buildXeniaResponseMetaHeaders } from "../../src/domain/xeniaResponseMeta.ts";

test("headers constant exposes the fallback-attempts key", () => {
  assert.equal(XENIA_RESPONSE_HEADERS.fallbackAttempts, "X-Xenia-Fallback-Attempts");
});

test("buildXeniaResponseMetaHeaders emits the fallback-attempts count when > 0", () => {
  const h = buildXeniaResponseMetaHeaders({
    model: "gpt",
    provider: "openai",
    fallbackAttempts: 2,
  });
  assert.equal(h["X-Xenia-Fallback-Attempts"], "2");
});

test("buildXeniaResponseMetaHeaders omits the header when 0 / absent", () => {
  const none = buildXeniaResponseMetaHeaders({ model: "gpt" });
  assert.equal(none["X-Xenia-Fallback-Attempts"], undefined);
  const zero = buildXeniaResponseMetaHeaders({ model: "gpt", fallbackAttempts: 0 });
  assert.equal(zero["X-Xenia-Fallback-Attempts"], undefined);
});
