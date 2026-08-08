/**
 * Provider catalog data — extracted from providers.ts (god-file decomposition).
 * Pure data literal; re-exported by the providers.ts barrel. No behavior change.
 */
export const CLOUD_AGENT_PROVIDERS = {
  jules: {
    id: "jules",
    alias: "jules",
    name: "Google Jules",
    icon: "engineering",
    color: "#7e7e7e",
    textIcon: "JL",
    website: "https://jules.google",
    authHint: "Jules API key for creating and managing cloud coding tasks.",
  },
  devin: {
    id: "devin",
    alias: "devin",
    name: "Devin",
    icon: "smart_toy",
    color: "#181818",
    textIcon: "DV",
    website: "https://devin.ai",
    authHint: "Devin API key for cloud agent sessions.",
  },
  "codex-cloud": {
    id: "codex-cloud",
    alias: "codex-cloud",
    name: "Codex Cloud",
    icon: "cloud",
    color: "#737373",
    textIcon: "CC",
    website: "https://openai.com/codex",
    authHint: "OpenAI API key with Codex Cloud task access.",
  },
};
