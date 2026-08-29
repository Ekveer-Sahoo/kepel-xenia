/**
 * Shared fixture for CCR engine tests.
 *
 * `ccrEngine.apply` only compresses for callers that advertise the
 * `xenia_ccr_retrieve` MCP tool (#7746) — a caller that cannot expand a marker
 * cannot get the replaced text back, so compressing for it would be silent data
 * loss. Tests that exercise compression mechanics (storage, hashing, retrieval
 * ramp, principal scoping) therefore have to model an MCP-capable caller.
 *
 * Tests asserting the skip-for-non-MCP behaviour itself deliberately omit this.
 */
export const CCR_RETRIEVE_TOOL = {
  type: "function",
  function: { name: "xenia_ccr_retrieve" },
} as const;

/** Tool array marking a request body as able to resolve CCR markers. */
export const MCP_CAPABLE_TOOLS: unknown[] = [CCR_RETRIEVE_TOOL];
