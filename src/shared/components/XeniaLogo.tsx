/**
 * Xenia mark — an open ring with a solid node at its leading edge. Abstract
 * rather than a letterform: the break in the ring reads as a continuous
 * loop/route rather than a closed shape, and the node marks where a request
 * lands — the gateway idea (many paths orbiting through one point) without
 * spelling out a literal "X". Pure `currentColor` stroke/fill so it inherits
 * whatever monochrome tone its container sets — no background plate, no
 * hardcoded color, no gradient.
 */
type XeniaLogoProps = {
  size?: number;
  className?: string;
};

export default function XeniaLogo({ size = 20, className = "" }: XeniaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="rotate(-45 16 16)">
        {/* Ring — ~75% of a circle, the rest left open as the "route" gap */}
        <circle
          cx="16"
          cy="16"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="47.1 15.7"
          strokeLinecap="round"
        />
        {/* Node — the leading edge where the ring breaks */}
        <circle cx="26" cy="16" r="3.4" fill="currentColor" />
      </g>
    </svg>
  );
}
