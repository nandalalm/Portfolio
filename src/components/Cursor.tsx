"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { motion } from "@/lib/motion";
import { store } from "@/lib/store";

/**
 * A small dot that trails the real cursor. It grows over links and buttons,
 * and shows a label over anything marked data-cursor="view".
 * Only on devices with a fine pointer; the native cursor stays visible.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0;
    let y = 0;
    let seen = false;

    const tick = () => {
      const c = store.cursor;
      if (!seen && c.active) {
        // First move: start at the pointer instead of flying in from the corner
        x = c.x;
        y = c.y;
        seen = true;
      }
      const k = 1 - Math.pow(1 - motion.lerp.cursor, gsap.ticker.deltaRatio(60));
      x += (c.x - x) * k;
      y += (c.y - y) * k;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.classList.toggle("is-on", seen && c.active);
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      const view = t?.closest('[data-cursor="view"]');
      const link = t?.closest("a, button");
      el.classList.toggle("is-view", !!view);
      el.classList.toggle("is-link", !view && !!link);
    };

    gsap.ticker.add(tick);
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <div className="cursor-dot">
        <span>View</span>
      </div>
    </div>
  );
}
