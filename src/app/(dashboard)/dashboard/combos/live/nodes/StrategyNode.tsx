"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

// ── Strategy color map ────────────────────────────────────────────────────

const STRATEGY_COLORS: Record<string, string> = {
  priority: "#7a7a7a",
  weighted: "#7c7c7c",
  "round-robin": "#858585",
  "fill-first": "#a7a7a7",
  p2c: "#808080",
  random: "#727272",
  "least-used": "#a2a2a2",
  "cost-optimized": "#898989",
  "reset-aware": "#909090",
  "reset-window": "#909090",
  "strict-random": "#808080",
  auto: "#757575",
  lkgp: "#828282",
  "context-optimized": "#858585",
  "context-relay": "#808080",
};

function getStrategyColor(strategy: string): string {
  return STRATEGY_COLORS[strategy] ?? "#727272";
}

// ── Node data shape ───────────────────────────────────────────────────────

export interface StrategyNodeData {
  label: string;
  strategy: string;
  targetCount: number;
  [key: string]: unknown;
}

// ── Component ─────────────────────────────────────────────────────────────

/**
 * StrategyNode — pill that shows the combo routing strategy + target count.
 * Custom ReactFlow node with Left/Right Handles (left = source from request,
 * right = target into first provider cascade).
 */
export function StrategyNode({ data }: NodeProps) {
  const { strategy, targetCount } = data as StrategyNodeData;
  const color = getStrategyColor(strategy as string);
  const label = (strategy as string) || "combo";
  const count = targetCount as number;

  return (
    <div
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-full border-2 bg-bg transition-all duration-300"
      style={{
        borderColor: color,
        boxShadow: `0 0 10px ${color}30`,
        minWidth: "110px",
      }}
      data-testid="strategy-node"
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      <span
        className="text-xs font-semibold uppercase tracking-wide truncate"
        style={{ color }}
        data-testid="strategy-label"
      >
        {label}
      </span>
      {count > 0 && (
        <span
          className="text-[10px] font-mono px-1.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
          data-testid="strategy-target-count"
        >
          {count} target{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

export default StrategyNode;
