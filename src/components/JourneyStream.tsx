"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The journey as a stream: one thin line that draws itself down the list as
 * you scroll, with each milestone's dot filling in as the line reaches it.
 * Sits inside the <ol>; without motion the list keeps its plain border.
 */
export default function JourneyStream() {
  const svg = useRef<SVGSVGElement>(null);
  const track = useRef<SVGPathElement>(null);
  const line = useRef<SVGPathElement>(null);

  useEffect(() => {
    const list = svg.current?.parentElement;
    if (!list || !track.current || !line.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const dots = [...list.querySelectorAll<HTMLElement>("[data-journey-dot]")];
    let ctx: gsap.Context | undefined;

    const build = () => {
      ctx?.revert();
      const h = list.offsetHeight;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      // A gentle meander: the line sways a few px either side as it falls
      const sway = rem * 0.45;
      const step = rem * 5.5;
      let d = "M0 0";
      for (let y = 0, i = 0; y < h; y += step, i++) {
        const y2 = Math.min(h, y + step);
        const s = i % 2 ? -sway : sway;
        d += ` C ${s} ${y + step * 0.33}, ${s} ${y + step * 0.66}, 0 ${y2}`;
      }
      svg.current!.setAttribute("height", String(h));
      svg.current!.setAttribute("viewBox", `${-rem} 0 ${rem * 2} ${h}`);
      track.current!.setAttribute("d", d);
      line.current!.setAttribute("d", d);
      const len = line.current!.getTotalLength();

      ctx = gsap.context(() => {
        list.style.borderColor = "transparent";
        gsap.fromTo(
          line.current,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: { trigger: list, start: "top 72%", end: "bottom 62%", scrub: 0.6 },
          },
        );
        dots.forEach((dot) => {
          gsap.fromTo(
            dot,
            { scale: 0.4, backgroundColor: "#8a94a6" },
            {
              scale: 1.5,
              backgroundColor: "#7fb4ff",
              duration: 0.5,
              ease: "back.out(3)",
              scrollTrigger: { trigger: dot, start: "top 70%", toggleActions: "play none none reverse" },
            },
          );
        });
      });
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(list);
    return () => {
      ro.disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <svg
      ref={svg}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 -left-4 w-8 overflow-visible"
      fill="none"
    >
      <path ref={track} stroke="rgb(255 255 255 / 0.08)" strokeWidth="1" />
      <path ref={line} stroke="#7fb4ff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
