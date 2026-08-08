/**
 * Canonical status colors — single source of truth for status HEX, mirroring the
 * semantic tokens in `src/app/globals.css` (--color-success / --color-warning /
 * --color-error). Previously these same hex values were copy-pasted across several
 * components (flow edge styles, token-health badge, cascade nodes…); this module
 * collapses them to one place.
 *
 * Use these HEX values ONLY where a CSS class can't reach — canvas, ReactFlow SVG
 * strokes, or inline styles on third-party nodes. For normal DOM, prefer the Tailwind
 * utilities (`text-success`, `bg-error/10`, …) which already read the same tokens.
 */
export const STATUS_HEX = {
  success: "#404040",
  warning: "#737373",
  error: "#0a0a0a",
  muted: "#a3a3a3",
} as const;
