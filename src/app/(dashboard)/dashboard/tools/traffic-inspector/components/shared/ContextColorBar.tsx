"use client";

interface ContextColorBarProps {
  contextKey?: string;
  className?: string;
}

// Monochrome theme: distinguish context keys by lightness, not hue.
function hashToLightness(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0xffffff;
  }
  return 30 + (hash % 45); // 30%–75% lightness band, stays visible on both themes
}

export function ContextColorBar({ contextKey, className }: ContextColorBarProps) {
  const lightness = contextKey ? hashToLightness(contextKey) : 0;
  const color = contextKey ? `hsl(0, 0%, ${lightness}%)` : "transparent";
  return (
    <div
      className={className}
      style={{ width: 3, minWidth: 3, backgroundColor: color, borderRadius: 2 }}
      title={contextKey ? `ctx #${contextKey.slice(0, 6)}` : undefined}
    />
  );
}
