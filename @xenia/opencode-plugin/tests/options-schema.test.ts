/**
 * T-08 options-schema tests.
 *
 * Covers `parseXeniaPluginOptions(opts)` — the strict Zod gate that
 * validates the second-arg `PluginOptions` bag from opencode.json before
 * any hook is wired. Anti-pattern checklist mirrored here:
 *
 *  - `null` / `undefined` must collapse to `{}` (defaults apply downstream).
 *  - Unknown keys must THROW (`.strict()` catches opencode.json typos).
 *  - Validation runs at parse time, not import time (module loads cleanly).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { parseXeniaPluginOptions } from "../src/index.js";

test("parseXeniaPluginOptions: undefined → {}", () => {
  assert.deepEqual(parseXeniaPluginOptions(undefined), {});
});

test("parseXeniaPluginOptions: null → {}", () => {
  assert.deepEqual(parseXeniaPluginOptions(null), {});
});

test("parseXeniaPluginOptions: empty object → {}", () => {
  assert.deepEqual(parseXeniaPluginOptions({}), {});
});

test("parseXeniaPluginOptions: valid providerId → returns it", () => {
  const r = parseXeniaPluginOptions({ providerId: "xenia-preprod" });
  assert.equal(r.providerId, "xenia-preprod");
});

test("parseXeniaPluginOptions: invalid providerId (special chars) → throws", () => {
  assert.throws(() => parseXeniaPluginOptions({ providerId: "xenia prod!" }), /providerId.*slug/i);
});

test("parseXeniaPluginOptions: empty providerId → throws", () => {
  assert.throws(() => parseXeniaPluginOptions({ providerId: "" }), /providerId/i);
});

test("parseXeniaPluginOptions: valid modelCacheTtl → returns it", () => {
  const r = parseXeniaPluginOptions({ modelCacheTtl: 60_000 });
  assert.equal(r.modelCacheTtl, 60_000);
});

test("parseXeniaPluginOptions: negative modelCacheTtl → throws", () => {
  assert.throws(() => parseXeniaPluginOptions({ modelCacheTtl: -1 }), /modelCacheTtl/i);
});

test("parseXeniaPluginOptions: zero modelCacheTtl → throws (positive required)", () => {
  assert.throws(() => parseXeniaPluginOptions({ modelCacheTtl: 0 }), /modelCacheTtl/i);
});

test("parseXeniaPluginOptions: invalid baseURL (not a URL) → throws", () => {
  assert.throws(() => parseXeniaPluginOptions({ baseURL: "not-a-url" }), /baseURL/i);
});

test("parseXeniaPluginOptions: unknown key → throws (strict mode catches typos)", () => {
  assert.throws(
    () =>
      parseXeniaPluginOptions({
        providerId: "xenia",
        provider_id: "typo-here",
      }),
    /provider_id|unrecognized/i
  );
});

test("parseXeniaPluginOptions: all four fields populated correctly → returns them", () => {
  const opts = {
    providerId: "xenia-prod",
    displayName: "Xenia Production",
    modelCacheTtl: 120_000,
    baseURL: "https://or.example.com/v1",
  };
  const r = parseXeniaPluginOptions(opts);
  assert.deepEqual(r, opts);
});

test("parseXeniaPluginOptions: error message lists every issue path", () => {
  // Two bad fields at once → error string should mention BOTH.
  try {
    parseXeniaPluginOptions({
      providerId: "",
      baseURL: "garbage",
    });
    assert.fail("expected throw");
  } catch (err) {
    const msg = (err as Error).message;
    assert.match(msg, /providerId/);
    assert.match(msg, /baseURL/);
  }
});

test("parseXeniaPluginOptions: module import alone does NOT throw", async () => {
  // Re-importing the entry must not trigger validation; validation only fires
  // on explicit parseXeniaPluginOptions / XeniaPlugin invocation.
  const mod = await import("../src/index.js");
  assert.equal(typeof mod.parseXeniaPluginOptions, "function");
});
