"use client";

import { useEffect, useRef } from "react";

/**
 * iPadOS-style pointer: a small monochrome circle that glides with a critically-damped
 * spring and morphs into a rounded-rect "puck" that snaps over whatever is hoverable,
 * mirroring the magnetic pointer effect from iPadOS trackpad/mouse support.
 *
 * Monochrome by construction: the puck is pure white with `mix-blend-mode: difference`,
 * so it inverts whatever is beneath it (black on light surfaces, white on dark ones) —
 * no color token needed, and it always stays legible across the app's dark/light themes.
 *
 * Desktop pointer devices only (`pointer: fine`) — touch devices keep the OS cursor/touch
 * behavior untouched. Respects `prefers-reduced-motion` by disabling the spring chase and
 * snapping instantly instead.
 */

const HOVER_SELECTOR =
  'a, button, [role="button"], input, select, textarea, summary, label, [data-cursor="hover"], .cursor-hover';
const TEXT_SELECTOR = 'p, span, h1, h2, h3, h4, h5, h6, [data-cursor="text"]';

type Rect = { x: number; y: number; w: number; h: number; radius: number };

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("xenia-custom-cursor");

    const DEFAULT: Rect = { x: -100, y: -100, w: 16, h: 16, radius: 8 };
    let target: Rect = { ...DEFAULT };
    let current: Rect = { ...DEFAULT };
    let velocity = { x: 0, y: 0, w: 0, h: 0 };
    let mouseX = -100;
    let mouseY = -100;
    let hovering = false;
    let textHovering = false;
    let pressed = false;
    let raf = 0;

    const clamp = (v: number) => Math.max(0.001, v);

    function springStep(dt: number) {
      // Critically-damped-ish spring per apple-design guidance: always animate from the
      // live presentation value, never snap to the target, so it stays interruptible.
      const stiffness = reduceMotion.matches ? 1 : 210;
      const damping = reduceMotion.matches ? 40 : 26;

      (["x", "y", "w", "h"] as const).forEach((key) => {
        const delta = target[key] - current[key];
        const accel = delta * stiffness - velocity[key] * damping;
        velocity[key] += accel * dt;
        current[key] += velocity[key] * dt;
      });
    }

    function paint() {
      const radius = target.radius;
      ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      ring.style.width = `${clamp(current.w)}px`;
      ring.style.height = `${clamp(current.h)}px`;
      ring.style.borderRadius = `${radius}px`;
      ring.style.opacity = hovering || textHovering ? "1" : "0.9";

      dot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0) scale(${
        pressed ? 0.6 : hovering ? 0 : 1
      })`;
    }

    let last = performance.now();
    function tick(now: number) {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      springStep(reduceMotion.matches ? 1 : dt);
      paint();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function setTargetFromPoint(x: number, y: number) {
      target = {
        x: x - DEFAULT.w / 2,
        y: y - DEFAULT.h / 2,
        w: DEFAULT.w,
        h: DEFAULT.h,
        radius: DEFAULT.radius,
      };
    }

    function onMove(e: PointerEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hovering) setTargetFromPoint(mouseX, mouseY);

      const el = document.elementFromPoint(mouseX, mouseY) as HTMLElement | null;
      const hoverEl = el?.closest<HTMLElement>(HOVER_SELECTOR);
      const textEl = !hoverEl ? el?.closest<HTMLElement>(TEXT_SELECTOR) : null;

      hovering = Boolean(hoverEl);
      textHovering = Boolean(textEl);

      if (hoverEl) {
        const r = hoverEl.getBoundingClientRect();
        const pad = 6;
        target = {
          x: r.left - pad,
          y: r.top - pad,
          w: r.width + pad * 2,
          h: r.height + pad * 2,
          radius: Math.min(r.height / 2 + pad, 22),
        };
      } else if (textHovering) {
        target = { x: mouseX - 1, y: mouseY - 12, w: 2, h: 24, radius: 1 };
      }
    }

    function onDown() {
      pressed = true;
    }
    function onUp() {
      pressed = false;
    }
    function onLeaveWindow() {
      target = { ...DEFAULT, x: -100, y: -100 };
      mouseX = -100;
      mouseY = -100;
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onLeaveWindow);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onLeaveWindow);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.documentElement.classList.remove("xenia-custom-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="xenia-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="xenia-cursor-dot" aria-hidden="true" />
    </>
  );
}

export default CustomCursor;
