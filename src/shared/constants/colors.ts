/**
 * Shared UI constants — Single source of truth for provider, protocol, and status colors.
 *
 * Previously duplicated in:
 * - RequestLoggerV2.js (PROTOCOL_COLORS, PROVIDER_COLORS, getStatusStyle)
 * - ProxyLogger.js (PROVIDER_COLORS, TYPE_COLORS, LEVEL_COLORS, getStatusStyle)
 * - UsageAnalytics.js (MODEL_COLORS, getModelColor)
 */

// ═══════════════════════════════════════════
// Provider Colors (used across all logger components)
// ═══════════════════════════════════════════

export const PROVIDER_COLORS = {
  github: { bg: "#5d5d5d", text: "#fff", label: "GitHub" },
  kiro: { bg: "#a6a6a6", text: "#000", label: "Kiro" },
  antigravity: { bg: "#7e7e7e", text: "#fff", label: "AG" },
  claude: { bg: "#919191", text: "#fff", label: "Claude" },
  codex: { bg: "#737373", text: "#fff", label: "Codex" },
  gemini: { bg: "#7c7c7c", text: "#fff", label: "Gemini" },
  qwen: { bg: "#757575", text: "#fff", label: "Qwen" },
  qoder: { bg: "#828282", text: "#fff", label: "Qoder" },
  fireworks: { bg: "#909090", text: "#fff", label: "Fireworks" },
  kimi: { bg: "#858585", text: "#fff", label: "Kimi" },
  // Dark foreground: #31f889 is a bright green, white text on it fails contrast.
  cheaperinference: { bg: "#b0b0b0", text: "#101010", label: "Cheaper Inference" },
};

// ═══════════════════════════════════════════
// Protocol Colors (RequestLoggerV2)
// ═══════════════════════════════════════════

export const PROTOCOL_COLORS = {
  openai: { bg: "#1c1c1c", text: "#fff", label: "OpenAI-Chat" },
  "openai-responses": { bg: "#1c1c1c", text: "#fff", label: "OpenAI-Responses" },
  claude: { bg: "#919191", text: "#fff", label: "Claude" },
  gemini: { bg: "#7e7e7e", text: "#fff", label: "Gemini" },
  warmup: { bg: "#a7a7a7", text: "#000", label: "Warmup" },
  bypass: { bg: "#727272", text: "#fff", label: "Bypass" },
};

const PROTOCOL_KEY_ALIASES = {
  "openai-chat": "openai",
  "openai-response": "openai-responses",
};

function normalizeProtocolKey(protocol) {
  return PROTOCOL_KEY_ALIASES[protocol] || protocol;
}

// ═══════════════════════════════════════════
// Proxy Type Colors (ProxyLogger)
// ═══════════════════════════════════════════

export const TYPE_COLORS = {
  http: { bg: "#7a7a7a", text: "#fff", label: "HTTP" },
  https: { bg: "#808080", text: "#fff", label: "HTTPS" },
  socks5: { bg: "#7c7c7c", text: "#fff", label: "SOCKS5" },
};

// ═══════════════════════════════════════════
// Level Colors (ProxyLogger)
// ═══════════════════════════════════════════

export const LEVEL_COLORS = {
  key: { bg: "#a7a7a7", text: "#000", label: "Key" },
  combo: { bg: "#7c7c7c", text: "#fff", label: "Combo" },
  provider: { bg: "#7a7a7a", text: "#fff", label: "Provider" },
  global: { bg: "#727272", text: "#fff", label: "Global" },
  direct: { bg: "#404040", text: "#a2a2a2", label: "Direct" },
};

// ═══════════════════════════════════════════
// Model Colors (charts/analytics)
// ═══════════════════════════════════════════

export const MODEL_COLORS = [
  "#919191",
  "#9a9a9a",
  "#9d9d9d",
  "#a0a0a0",
  "#a1a1a1",
  "#bfbfbf",
  "#9c9c9c",
  "#a8a8a8",
  "#959595",
  "#a0a0a0",
  "#a9a9a9",
  "#999999",
  "#a7a7a7",
  "#a4a4a4",
  "#9d9d9d",
];

/**
 * Get a model color by index (cycles through palette).
 * @param {number} index
 * @returns {string} Hex color
 */
export function getModelColor(index) {
  return MODEL_COLORS[index % MODEL_COLORS.length];
}

// ═══════════════════════════════════════════
// Status Styling Helpers
// ═══════════════════════════════════════════

/**
 * Get badge style for HTTP status codes (RequestLoggerV2).
 * @param {number} status - HTTP status code
 * @returns {{ bg: string, text: string }}
 */
export function getHttpStatusStyle(status) {
  if (status >= 200 && status < 300) return { bg: "#666666", text: "#fff" };
  if (status >= 400 && status < 500) return { bg: "#878787", text: "#fff" };
  if (status >= 500) return { bg: "#5c5c5c", text: "#fff" };
  if (status === 0) return { bg: "#757575", text: "#fff" }; // pending
  return { bg: "#727272", text: "#fff" };
}

/**
 * Get badge style for string-based status (ProxyLogger).
 * @param {string} status - Status string ("success", "error", "timeout")
 * @returns {{ bg: string, text: string }}
 */
export function getProxyStatusStyle(status) {
  if (status === "success") return { bg: "#666666", text: "#fff" };
  if (status === "error") return { bg: "#5c5c5c", text: "#fff" };
  if (status === "timeout") return { bg: "#878787", text: "#fff" };
  return { bg: "#727272", text: "#fff" };
}

/**
 * Get default fallback for a protocol color lookup.
 * @param {string} protocol - Protocol key
 * @param {string} fallbackProvider - Provider key to use as a secondary protocol key
 * @returns {{ bg: string, text: string, label: string }}
 */
export function getProtocolColor(protocol, fallbackProvider) {
  const normalized = normalizeProtocolKey(protocol);
  return (
    PROTOCOL_COLORS[normalized] ||
    PROTOCOL_COLORS[fallbackProvider] || {
      bg: "#727272",
      text: "#fff",
      label: (protocol || fallbackProvider || "-").toUpperCase(),
    }
  );
}
