"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Layer } from "@/lib/content";

/**
 * Exploded architecture. The layers of a system start stacked flat and float
 * apart in 3D as the section scrolls in, with a stream running down through
 * them. Hovering a layer (or its row in the list) lights up both.
 */
export default function Architecture({ layers, color }: { layers: Layer[]; color: string }) {
  const section = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const n = layers.length;

  useEffect(() => {
    if (!section.current || !stack.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stack.current.style.setProperty("--g", "1");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stack.current,
        { "--g": 0, rotateZ: -24 },
        {
          "--g": 1,
          rotateZ: -38,
          ease: "none",
          scrollTrigger: { trigger: section.current, start: "top 78%", end: "center 48%", scrub: 0.8 },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={section} className="grid items-center gap-x-[6vw] gap-y-16 md:grid-cols-2">
      {/* pt: the layers rise upwards as they separate, so start the stack low */}
      <div
        className="arch-stage flex h-[clamp(27rem,40vw,34rem)] items-center justify-center pt-[15rem]"
        aria-hidden="true"
      >
        <div
          ref={stack}
          className="arch-stack"
          style={{ "--c": color, "--n": n - 1, transform: "rotateX(58deg) rotateZ(-38deg)" } as React.CSSProperties}
        >
          <div className="arch-flow" />
          {layers.map((l, i) => (
            <div
              key={l.name}
              className={`arch-plate ${active === i ? "is-active" : ""}`}
              style={{ "--z": n - 1 - i } as React.CSSProperties}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(-1)}
            >
              <span className="font-mono text-[0.75rem] text-ink">
                {String(i + 1).padStart(2, "0")} {l.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ol className="border-t border-line">
        {layers.map((l, i) => (
          <li
            key={l.name}
            data-reveal
            data-reveal-delay={i * 0.06}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(-1)}
            className="flex gap-5 border-b border-line py-5 transition-colors duration-[var(--dur-fast)]"
            style={active === i ? { borderBottomColor: color } : undefined}
          >
            <span className="label pt-1" style={{ color }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-[1.375rem] font-medium tracking-[-0.01em]">{l.name}</h3>
              <p className="mt-1 text-[0.9375rem] text-muted">{l.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
