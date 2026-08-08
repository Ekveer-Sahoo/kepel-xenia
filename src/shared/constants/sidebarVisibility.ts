export * from "./sidebarVisibility/types";
export { COMPRESSION_CONTEXT_GROUP, SIDEBAR_SECTIONS } from "./sidebarVisibility/sections";

import { HIDEABLE_SIDEBAR_ITEM_IDS } from "./sidebarVisibility/types";
import type {
  HideableSidebarItemId,
  SidebarItemId,
  SidebarSectionId,
  SidebarItemDefinition,
  SidebarSectionChild,
  SidebarSectionDefinition,
  SidebarPresetDefinition,
} from "./sidebarVisibility/types";

export const SIDEBAR_ICON_ACCENTS: Partial<Record<SidebarItemId, string>> = {
  home: "#9a9a9a",
  "api-manager": "#a7a7a7",
  endpoints: "#9c9c9c",
  providers: "#959595",
  combos: "#808080",
  quota: "#a1a1a1",
  "context-caveman": "#909090",
  "context-rtk": "#a0a0a0",
  "context-combos": "#a4a4a4",
  "cli-code": "#c5c5c5",
  "cli-agents": "#bcbcbc",
  "cloud-agents": "#bebebe",
  "api-endpoints": "#858585",
  webhooks: "#828282",
  proxy: "#bebebe",
  "mitm-proxy": "#9d9d9d",
  "1proxy": "#a1a1a1",
  analytics: "#858585",
  "analytics-combo-health": "#9d9d9d",
  "analytics-utilization": "#bfbfbf",
  costs: "#a8a8a8",
  cache: "#a2a2a2",
  "analytics-compression": "#909090",
  "analytics-search": "#9c9c9c",
  "analytics-evals": "#a0a0a0",
  logs: "#d3d3d3",
  "logs-proxy": "#bebebe",
  "logs-console": "#c5c5c5",
  "logs-timeline": "#a1a1a1",
  "logs-activity": "#9a9a9a",
  health: "#777777",
  runtime: "#a7a7a7",
  "costs-pricing": "#a8a8a8",
  "costs-budget": "#898989",
  "costs-quota-share": "#858585",
  audit: "#797979",
  "audit-mcp": "#959595",
  "audit-a2a": "#808080",
  translator: "#7a7a7a",
  playground: "#b0b0b0",
  "search-tools": "#6c6c6c",
  memory: "#808080",
  skills: "#797979",
  "agent-skills": "#858585",
  mcp: "#7c7c7c",
  a2a: "#858585",
  leaderboard: "#c5c5c5",
  profile: "#9a9a9a",
  tokens: "#bebebe",
  media: "#858585",
  batch: "#858585",
  "batch-files": "#9c9c9c",
  "settings-general": "#727272",
  "settings-appearance": "#858585",
  "settings-ai": "#a0a0a0",
  "settings-routing": "#858585",
  "settings-resilience": "#898989",
  "settings-advanced": "#909090",
  "settings-security": "#777777",
  "settings-feature-flags": "#c5c5c5",
  "settings-cache": "#a2a2a2",
  "settings-sidebar": "#9c9c9c",
  docs: "#606060",
  issues: "#5c5c5c",
  changelog: "#a7a7a7",
};

export const SIDEBAR_SUBITEM_ICON_ACCENTS: Record<string, string> = {};

// Monochrome theme: any sidebar item without an explicit entry in
// SIDEBAR_ICON_ACCENTS still needs a deterministic-but-stable accent so icons
// don't all collapse to one flat gray — so we hash to a gray *lightness*
// (no hue/saturation) instead of an HSL rainbow color.
function getDeterministicIconAccent(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  // Keep it within the same readable gray band as SIDEBAR_ICON_ACCENTS (~0x5c–0xd3).
  const lightness = 0x5c + (hash % (0xd3 - 0x5c));
  const channel = lightness.toString(16).padStart(2, "0").toUpperCase();
  return `#${channel}${channel}${channel}`;
}

export function getSidebarIconAccent(id: string): string {
  return (
    SIDEBAR_ICON_ACCENTS[id as SidebarItemId] ||
    SIDEBAR_SUBITEM_ICON_ACCENTS[id] ||
    getDeterministicIconAccent(id)
  );
}

/**
 * Decide whether a sidebar item should be shown given a resolved feature-flag
 * map. Items without `featureFlagKey` are always visible. Fails OPEN when the
 * flag isn't present in the map (e.g. `/api/settings` hasn't returned yet, or
 * an older server response predates the flag) — a missing entry must never
 * hide an unrelated item.
 */
export function isSidebarItemVisibleForFlags(
  item: Pick<SidebarItemDefinition, "featureFlagKey">,
  flags: Record<string, boolean>
): boolean {
  if (!item.featureFlagKey) return true;
  return flags[item.featureFlagKey] !== false;
}

export function getSectionItems(
  section: SidebarSectionDefinition | { children: readonly SidebarSectionChild[] }
): readonly SidebarItemDefinition[] {
  return section.children.flatMap((child) =>
    "type" in child && child.type === "group" ? child.items : [child as SidebarItemDefinition]
  );
}

// ─── Ordering & preset setting keys ──────────────────────────────────────────

export const HIDDEN_SIDEBAR_ITEMS_SETTING_KEY = "hiddenSidebarItems";
export const SIDEBAR_SECTION_ORDER_KEY = "sidebarSectionOrder";
export const SIDEBAR_ITEM_ORDER_KEY = "sidebarItemOrder";
export const SIDEBAR_PRESET_KEY = "sidebarActivePreset";
export const SIDEBAR_SETTINGS_UPDATED_EVENT = "xenia:settings-updated";

const MINIMAL_SHOWN: ReadonlySet<HideableSidebarItemId> = new Set([
  "home",
  "endpoints",
  "api-manager",
  "providers",
  "combos",
  "analytics",
  "costs",
  "logs",
  "health",
  "settings-general",
  "settings-sidebar",
  "docs",
  "changelog",
]);

const DEVELOPER_SHOWN: ReadonlySet<HideableSidebarItemId> = new Set([
  "home",
  "endpoints",
  "api-manager",
  "providers",
  "combos",
  "quota",
  "context-caveman",
  "context-rtk",
  "context-combos",
  "cli-code",
  "cli-agents",
  "acp-agents",
  "api-endpoints",
  "analytics",
  "analytics-combo-health",
  "costs",
  "cache",
  "logs",
  "health",
  "runtime",
  "translator",
  "playground",
  "memory",
  "skills",
  "mcp",
  "a2a",
  "settings-general",
  "settings-routing",
  "settings-resilience",
  "settings-sidebar",
  "docs",
  "issues",
  "changelog",
]);

const ADMIN_SHOWN: ReadonlySet<HideableSidebarItemId> = new Set([
  "home",
  "endpoints",
  "api-manager",
  "providers",
  "combos",
  "quota",
  "analytics",
  "analytics-combo-health",
  "analytics-utilization",
  "costs",
  "costs-pricing",
  "costs-budget",
  "costs-quota-share",
  "cache",
  "logs",
  "activity",
  "health",
  "runtime",
  "audit",
  "audit-mcp",
  "audit-a2a",
  "settings-general",
  "settings-routing",
  "settings-resilience",
  "settings-security",
  "settings-access-tokens",
  "settings-feature-flags",
  "settings-sidebar",
  "docs",
  "changelog",
]);

function buildHiddenList(shown: ReadonlySet<HideableSidebarItemId>): HideableSidebarItemId[] {
  return HIDEABLE_SIDEBAR_ITEM_IDS.filter((id) => !shown.has(id));
}

export const SIDEBAR_PRESETS: readonly SidebarPresetDefinition[] = [
  { id: "all", icon: "select_all", hiddenItems: [] },
  { id: "minimal", icon: "minimize", hiddenItems: buildHiddenList(MINIMAL_SHOWN) },
  { id: "developer", icon: "code", hiddenItems: buildHiddenList(DEVELOPER_SHOWN) },
  { id: "admin", icon: "admin_panel_settings", hiddenItems: buildHiddenList(ADMIN_SHOWN) },
];

// ─── Ordering utilities ───────────────────────────────────────────────────────

export function applySectionOrder(
  sections: readonly SidebarSectionDefinition[],
  order: SidebarSectionId[]
): SidebarSectionDefinition[] {
  if (order.length === 0) return [...sections];
  const knownIds = new Set(sections.map((s) => s.id));
  const validOrder = order.filter((id) => knownIds.has(id));
  const orderMap = new Map(validOrder.map((id, i) => [id, i]));
  return [...sections].sort((a, b) => {
    const ai = orderMap.get(a.id) ?? validOrder.length + sections.indexOf(a);
    const bi = orderMap.get(b.id) ?? validOrder.length + sections.indexOf(b);
    return ai - bi;
  });
}

export function applyItemOrder(
  children: readonly SidebarSectionChild[],
  order: string[]
): SidebarSectionChild[] {
  if (order.length === 0) return [...children];
  const getChildId = (c: SidebarSectionChild): string =>
    "type" in c && c.type === "group" ? c.id : (c as SidebarItemDefinition).id;
  const knownIds = new Set(children.map(getChildId));
  const validOrder = order.filter((id) => knownIds.has(id));
  const orderMap = new Map(validOrder.map((id, i) => [id, i]));
  return [...children].sort((a, b) => {
    const aId = getChildId(a);
    const bId = getChildId(b);
    const ai = orderMap.get(aId) ?? validOrder.length + children.indexOf(a);
    const bi = orderMap.get(bId) ?? validOrder.length + children.indexOf(b);
    return ai - bi;
  });
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export function normalizeHiddenSidebarItems(value: unknown): HideableSidebarItemId[] {
  if (!Array.isArray(value)) return [];

  const hiddenItems = new Set<HideableSidebarItemId>();

  for (const item of value) {
    if (
      typeof item === "string" &&
      HIDEABLE_SIDEBAR_ITEM_IDS.includes(item as HideableSidebarItemId)
    ) {
      hiddenItems.add(item as HideableSidebarItemId);
    }
  }

  return HIDEABLE_SIDEBAR_ITEM_IDS.filter((item) => hiddenItems.has(item));
}
