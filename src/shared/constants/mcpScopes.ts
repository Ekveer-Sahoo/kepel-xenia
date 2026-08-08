/**
 * MCP Authorization Scopes — Defines permission scopes for each MCP tool.
 *
 * Each tool requires specific scopes to execute. API keys can be configured
 * with a subset of scopes to limit tool access (least-privilege).
 */

// ============ Scope Definitions ============

/** All available MCP scopes */
export const MCP_SCOPE_LIST = [
  "read:health",
  "read:combos",
  "write:combos",
  "read:quota",
  "read:usage",
  "read:models",
  "execute:completions",
  "execute:search",
  "write:budget",
  "write:resilience",
  "pricing:write",
  "read:cache",
  "write:cache",
  "read:compression",
  "write:compression",
  "read:proxies",
] as const;

export type McpScope = (typeof MCP_SCOPE_LIST)[number];

// ============ Tool → Scope Mapping ============

/** Maps each MCP tool to its required scopes */
export const MCP_TOOL_SCOPES: Record<string, readonly McpScope[]> = {
  // Phase 1: Essential Tools
  xenia_get_health: ["read:health"],
  xenia_list_combos: ["read:combos"],
  xenia_get_combo_metrics: ["read:combos"],
  xenia_switch_combo: ["write:combos"],
  xenia_check_quota: ["read:quota"],
  xenia_route_request: ["execute:completions"],
  xenia_web_search: ["execute:search"],
  xenia_web_fetch: ["execute:search"],
  xenia_cost_report: ["read:usage"],
  xenia_list_models_catalog: ["read:models"],

  // Phase 2: Advanced Tools
  xenia_simulate_route: ["read:health", "read:combos"],
  xenia_set_budget_guard: ["write:budget"],
  xenia_set_resilience_profile: ["write:resilience"],
  xenia_test_combo: ["execute:completions", "read:combos"],
  xenia_get_provider_metrics: ["read:health"],
  xenia_best_combo_for_task: ["read:combos", "read:health"],
  xenia_explain_route: ["read:health", "read:usage"],
  xenia_get_session_snapshot: ["read:usage"],
  xenia_db_health_check: ["read:health", "write:resilience"],
  xenia_sync_pricing: ["pricing:write"],
  xenia_cache_stats: ["read:cache"],
  xenia_cache_flush: ["write:cache"],
  xenia_compression_status: ["read:compression"],
  xenia_compression_configure: ["write:compression"],
  xenia_set_compression_engine: ["write:compression"],
  xenia_list_compression_combos: ["read:compression"],
  xenia_compression_combo_stats: ["read:compression"],
  xenia_ccr_store: ["write:compression"],
  xenia_ccr_retrieve: ["read:compression"],
  xenia_ccr_inspect: ["read:compression"],
  xenia_ccr_list: ["read:compression"],
  xenia_ccr_delete: ["write:compression"],
  xenia_ccr_stats: ["read:compression"],
  xenia_oneproxy_fetch: ["read:proxies"],
  xenia_oneproxy_rotate: ["read:proxies"],
  xenia_oneproxy_stats: ["read:proxies"],

  // Web-session pool observability (read) + lifecycle (write)
  xenia_pool_status: ["read:health"],
  xenia_pool_sessions: ["read:health"],
  xenia_pool_health: ["read:health"],
  xenia_pool_reset: ["write:resilience"],
  xenia_pool_warm: ["write:resilience"],
  // Stealth browser pool observability (#3368 PR7)
  xenia_browser_pool_status: ["read:health"],
} as const;
