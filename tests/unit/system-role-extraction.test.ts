import test from "node:test";
import assert from "node:assert/strict";
import {
  extractSystemRoleMessages,
  extractLeadingSystemRoleMessages,
} from "../../open-sse/handlers/chatCore.ts";

test("extractSystemRoleMessages moves role=system to top-level system", () => {
  const payload = {
    messages: [
      { role: "system", content: "Memory context: foo" },
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.messages[0].role, "user");
  assert.deepEqual(payload.system, [{ type: "text", text: "Memory context: foo" }]);
});

test("extractSystemRoleMessages also lifts role=developer (OpenAI Responses system alias)", () => {
  const payload = {
    messages: [
      { role: "developer", content: "Dev instructions" },
      { role: "system", content: "Sys context" },
      { role: "user", content: "hello" },
    ],
  };
  extractSystemRoleMessages(payload);
  // both developer and system are removed from messages and lifted into system
  assert.equal(payload.messages.length, 1);
  assert.equal(payload.messages[0].role, "user");
  assert.deepEqual(payload.system, [
    { type: "text", text: "Dev instructions" },
    { type: "text", text: "Sys context" },
  ]);
});

test("extractSystemRoleMessages merges with existing top-level system string", () => {
  const payload = {
    system: "You are Claude.",
    messages: [
      { role: "system", content: "Memory context: bar" },
      { role: "user", content: "hello" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 1);
  assert.deepEqual(payload.system, [
    { type: "text", text: "You are Claude." },
    { type: "text", text: "Memory context: bar" },
  ]);
});

test("extractSystemRoleMessages merges with existing top-level system array", () => {
  const payload = {
    system: [{ type: "text", text: "Existing system" }],
    messages: [
      { role: "system", content: "Memory context: baz" },
      { role: "user", content: "hello" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 1);
  assert.deepEqual(payload.system, [
    { type: "text", text: "Existing system" },
    { type: "text", text: "Memory context: baz" },
  ]);
});

test("extractSystemRoleMessages does nothing when no system role messages", () => {
  const payload = {
    messages: [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.system, undefined);
});

test("extractSystemRoleMessages handles non-array messages gracefully", () => {
  const payload = { messages: "not-an-array" };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages, "not-an-array");
});

test("extractSystemRoleMessages handles empty messages array", () => {
  const payload = { messages: [] };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 0);
});

test("extractSystemRoleMessages handles case-insensitive role System", () => {
  const payload = {
    messages: [
      { role: "System", content: "Memory context: caps" },
      { role: "user", content: "hello" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 1);
  assert.deepEqual(payload.system, [{ type: "text", text: "Memory context: caps" }]);
});

test("extractSystemRoleMessages drops empty text content from system messages", () => {
  const payload = {
    messages: [
      { role: "system", content: "" },
      { role: "system", content: "valid" },
      { role: "user", content: "hello" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 1);
  assert.deepEqual(payload.system, [{ type: "text", text: "valid" }]);
});

test("extractSystemRoleMessages handles system messages with array content", () => {
  const payload = {
    messages: [
      {
        role: "system",
        content: [
          { type: "text", text: "Block 1" },
          { type: "text", text: "Block 2" },
        ],
      },
      { role: "user", content: "hello" },
    ],
  };
  extractSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 1);
  assert.deepEqual(payload.system, [
    { type: "text", text: "Block 1" },
    { type: "text", text: "Block 2" },
  ]);
});

// Regression: #9700-class bug — a compression engine unshifts a role:"system"
// instruction onto messages[0]. On Claude Opus 5 requests eligible for
// Anthropic's mid-conversation system message feature, the caller must still
// hoist a *leading* system-role message (messages[0] is never valid for it),
// while leaving any genuinely mid-conversation system-role message in place.
test("extractLeadingSystemRoleMessages hoists a leading system message at index 0", () => {
  const payload = {
    system: "You are Claude.",
    messages: [
      { role: "system", content: "Output style: caveman mode." },
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ],
  };
  extractLeadingSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.messages[0].role, "user");
  assert.deepEqual(payload.system, [
    { type: "text", text: "You are Claude." },
    { type: "text", text: "Output style: caveman mode." },
  ]);
});

test("extractLeadingSystemRoleMessages hoists multiple contiguous leading system messages", () => {
  const payload = {
    messages: [
      { role: "system", content: "First" },
      { role: "developer", content: "Second" },
      { role: "user", content: "hello" },
    ],
  };
  extractLeadingSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 1);
  assert.equal(payload.messages[0].role, "user");
  assert.deepEqual(payload.system, [
    { type: "text", text: "First" },
    { type: "text", text: "Second" },
  ]);
});

test("extractLeadingSystemRoleMessages leaves a genuinely mid-conversation system message in place", () => {
  const payload = {
    system: "You are Claude.",
    messages: [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
      { role: "system", content: "Terse mode enabled." },
    ],
  };
  extractLeadingSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 3);
  assert.equal(payload.messages[2].role, "system");
  assert.equal(payload.system, "You are Claude.");
});

test("extractLeadingSystemRoleMessages does nothing when messages[0] is not system role", () => {
  const payload = {
    messages: [
      { role: "user", content: "hello" },
      { role: "system", content: "Mid-conversation note." },
    ],
  };
  extractLeadingSystemRoleMessages(payload);
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.system, undefined);
});

test("extractLeadingSystemRoleMessages handles non-array messages gracefully", () => {
  const payload = { messages: "not-an-array" };
  extractLeadingSystemRoleMessages(payload);
  assert.equal(payload.messages, "not-an-array");
});
