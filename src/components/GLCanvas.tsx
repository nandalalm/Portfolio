"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { GLApp } from "@/gl/app";
import { store } from "@/lib/store";

/** Runs a callback when the browser has a quiet moment (or after `timeout` ms) */
function whenIdle(cb: () => void, timeout = 1200) {
  // Safari has no requestIdleCallback
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(cb, 200);
  return () => clearTimeout(id);
}

/**
 * The one WebGL canvas, fixed behind the page.
 *
 * The page first paints as plain HTML (the name, a still-water gradient and the
 * project stand-ins), so it is readable straight away. The canvas starts when
 * the browser is idle, compiles its shaders in the background, and only once it
 * has drawn its first frame does `data-gl` go on <html>, telling the CSS to hand
 * the marked visuals over. Without WebGL2, or with reduced motion, the HTML
 * version simply stays.
 */
export default function GLCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const app = useRef<GLApp | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let gl: GLApp | null = null;
    let alive = true;
    let cancelIdle = () => {};

    const start = async () => {
      try {
        gl = new GLApp(ref.current!);
        // Text is drawn into textures, so the real fonts must be in
        await Promise.all([gl.whenReady(), document.fonts.ready]);
      } catch (err) {
        console.warn("WebGL layer disabled:", err);
        return;
      }
      if (!alive) return;
      gl.onFirstFrame = () => {
        root.dataset.gl = "1";
      };
      gl.scan();
      app.current = gl;
      store.gl = gl;
      gsap.ticker.add(gl.frame);
    };
    cancelIdle = whenIdle(() => void start());

    return () => {
      alive = false;
      cancelIdle();
      if (gl) {
        gsap.ticker.remove(gl.frame);
        gl.destroy();
      }
      delete root.dataset.gl;
      app.current = null;
      store.gl = null;
    };
  }, []);

  // New page, new elements to track
  useEffect(() => {
    app.current?.scan();
  }, [pathname]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
