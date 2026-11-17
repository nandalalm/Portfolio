"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "@/lib/motion";
import { store } from "@/lib/store";

/**
 * The single animation loop.
 * Lenis is driven by GSAP's ticker, so smooth scroll, ScrollTrigger and (later)
 * the WebGL canvas all update in the same frame and never drift apart.
 */
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = new Lenis({ lerp: reduce ? 1 : motion.lerp.scroll, autoRaf: false });
    store.lenis = lenis;

    lenis.on("scroll", (l: Lenis) => {
      store.scroll = l.scroll;
      store.velocity = l.velocity;
      store.progress = l.progress;
      ScrollTrigger.update();
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Cursor values shared with every effect
    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      const c = store.cursor;
      c.speed = Math.hypot(e.clientX - px, e.clientY - py);
      px = c.x = e.clientX;
      py = c.y = e.clientY;
      c.nx = e.clientX / window.innerWidth;
      c.ny = 1 - e.clientY / window.innerHeight;
      c.active = true;
    };
    const onLeave = () => {
      store.cursor.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      lenis.destroy();
      store.lenis = null;
    };
  }, []);

  return null;
}
