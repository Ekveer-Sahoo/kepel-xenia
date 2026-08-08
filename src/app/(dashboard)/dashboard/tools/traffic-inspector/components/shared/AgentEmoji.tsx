"use client";

import type { AgentId } from "@/mitm/types";

const AGENT_COLORS: Record<AgentId, { emoji: string; label: string; color: string }> = {
  antigravity: { emoji: "🔵", label: "AG", color: "text-gray-400" },
  kiro: { emoji: "🟠", label: "KR", color: "text-gray-400" },
  copilot: { emoji: "🟢", label: "CP", color: "text-gray-400" },
  "ghe-copilot": { emoji: "🟩", label: "GHE", color: "text-gray-400" },
  codex: { emoji: "🟣", label: "CD", color: "text-gray-400" },
  cursor: { emoji: "🔶", label: "CU", color: "text-gray-400" },
  zed: { emoji: "🔷", label: "ZD", color: "text-gray-400" },
  "claude-code": { emoji: "🟡", label: "CC", color: "text-gray-300" },
  "open-code": { emoji: "⚪", label: "OC", color: "text-gray-400" },
  trae: { emoji: "⬛", label: "TR", color: "text-gray-500" },
};

interface AgentEmojiProps {
  agentId?: AgentId | string;
  className?: string;
}

export function AgentEmoji({ agentId, className }: AgentEmojiProps) {
  if (!agentId) return <span className={`text-sm ${className ?? ""}`}>🌐</span>;
  const info = AGENT_COLORS[agentId as AgentId];
  if (!info) return <span className={`text-sm ${className ?? ""}`}>🌐</span>;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono ${info.color} ${className ?? ""}`}
      title={agentId}
    >
      {info.emoji} {info.label}
    </span>
  );
}
