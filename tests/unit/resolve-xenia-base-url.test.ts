import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_XENIA_BASE_URL,
  resolveXeniaBaseUrl,
} from "../../src/shared/utils/resolveXeniaBaseUrl.ts";

test("resolveXeniaBaseUrl prefers XENIA_BASE_URL", () => {
  assert.equal(
    resolveXeniaBaseUrl({
      XENIA_BASE_URL: "https://internal.example.com/",
      BASE_URL: "https://base.example.com",
      NEXT_PUBLIC_BASE_URL: "https://public.example.com",
    }),
    "https://internal.example.com"
  );
});

test("resolveXeniaBaseUrl falls back to BASE_URL", () => {
  assert.equal(
    resolveXeniaBaseUrl({
      BASE_URL: "https://base.example.com/",
      NEXT_PUBLIC_BASE_URL: "https://public.example.com",
    }),
    "https://base.example.com"
  );
});

test("resolveXeniaBaseUrl falls back to NEXT_PUBLIC_BASE_URL", () => {
  assert.equal(
    resolveXeniaBaseUrl({
      NEXT_PUBLIC_BASE_URL: "https://public.example.com/",
    }),
    "https://public.example.com"
  );
});

test("resolveXeniaBaseUrl ignores blank values", () => {
  assert.equal(
    resolveXeniaBaseUrl({
      XENIA_BASE_URL: "   ",
      BASE_URL: "",
      NEXT_PUBLIC_BASE_URL: " https://public.example.com/ ",
    }),
    "https://public.example.com"
  );
});

test("resolveXeniaBaseUrl uses the default localhost fallback", () => {
  assert.equal(resolveXeniaBaseUrl({}), DEFAULT_XENIA_BASE_URL);
});
