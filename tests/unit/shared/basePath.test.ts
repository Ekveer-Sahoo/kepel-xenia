import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDeployBasePath,
  normalizeBasePath,
  withBasePath,
} from "../../../src/shared/utils/basePath";

describe("normalizeBasePath", () => {
  it("normalizes leading/trailing slashes", () => {
    assert.equal(normalizeBasePath("xenia"), "/xenia");
    assert.equal(normalizeBasePath("/xenia/"), "/xenia");
    assert.equal(normalizeBasePath("/xenia"), "/xenia");
    assert.equal(normalizeBasePath(""), "");
    assert.equal(normalizeBasePath("/"), "");
    assert.equal(normalizeBasePath(null), "");
  });
});

describe("getDeployBasePath", () => {
  it("reads NEXT_PUBLIC_XENIA_BASE_PATH first", () => {
    assert.equal(
      getDeployBasePath({
        NEXT_PUBLIC_XENIA_BASE_PATH: "/xenia",
        XENIA_BASE_PATH: "/other",
      } as NodeJS.ProcessEnv),
      "/xenia"
    );
  });

  it("falls back to XENIA_BASE_PATH", () => {
    assert.equal(
      getDeployBasePath({
        XENIA_BASE_PATH: "/xenia",
      } as NodeJS.ProcessEnv),
      "/xenia"
    );
  });
});

describe("withBasePath", () => {
  const base = "/xenia";

  it("is a no-op when basePath is empty", () => {
    assert.equal(withBasePath("/api/health/ping", ""), "/api/health/ping");
  });

  it("prefixes absolute app paths", () => {
    assert.equal(withBasePath("/api/health/ping", base), "/xenia/api/health/ping");
    assert.equal(withBasePath("/v1/models", base), "/xenia/v1/models");
  });

  it("does not double-prefix", () => {
    assert.equal(withBasePath("/xenia/api/health/ping", base), "/xenia/api/health/ping");
    assert.equal(withBasePath("/xenia", base), "/xenia");
  });

  it("rewrites same-origin absolute URLs", () => {
    assert.equal(
      withBasePath("https://host.example/api/x", base, "https://host.example"),
      "https://host.example/xenia/api/x"
    );
  });

  it("leaves external absolute URLs alone", () => {
    assert.equal(
      withBasePath("https://other.example/api/x", base, "https://host.example"),
      "https://other.example/api/x"
    );
  });

  it("leaves protocol-relative URLs alone", () => {
    assert.equal(withBasePath("//cdn.example/app.js", base), "//cdn.example/app.js");
  });
});
