"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { motion } from "@/lib/motion";
import { store } from "@/lib/store";

/**
 * Page-level text motion:
 *  - [data-reveal]   rises in once
 *  - [data-split]    splits into lines that rise from behind a mask, staggered
 *  - [data-magnetic] pulls toward the cursor when it is close
 *
 * Rendered inside the page (not the layout) so it runs after the page's own
 * markup has hydrated; GSAP must not touch elements React hasn't claimed yet.
 */
export default function Reveals() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      // This page's content is in the DOM now: let the canvas pick up its elements
      store.gl?.scan();
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 36, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: motion.dur.base,
              ease: motion.ease.flow,
              delay: Number(el.dataset.revealDelay ?? 0),
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          );
        });

        // autoSplit re-splits when the width or fonts change; returning the
        // tween lets SplitText carry its progress over to the new lines.
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            // Only lines are wrapped, so the text itself stays intact and readable.
            // ("auto" would add aria-label, which isn't allowed on <p> or <h2> without a role.)
            aria: "none",
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 115,
                duration: motion.dur.slow,
                ease: motion.ease.flow,
                stagger: motion.stagger.line,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              }),
          });
        });

        // Numbers count up from zero ("4.6★", "500+": the number animates, the rest stays)
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const m = (el.textContent ?? "").trim().match(/^(\d+(?:\.\d+)?)(.*)$/);
          if (!m) return;
          const end = parseFloat(m[1]);
          const decimals = (m[1].split(".")[1] ?? "").length;
          const v = { n: 0 };
          gsap.to(v, {
            n: end,
            duration: motion.dur.slow,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
            onUpdate: () => {
              el.textContent = v.n.toFixed(decimals) + m[2];
            },
          });
        });

        // Magnetic elements (fine pointers only)
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        const mags = gsap.utils.toArray<HTMLElement>("[data-magnetic]").map((el) => ({
          el,
          x: gsap.quickTo(el, "x", { duration: 0.7, ease: motion.ease.flow }),
          y: gsap.quickTo(el, "y", { duration: 0.7, ease: motion.ease.flow }),
          on: false,
        }));
        const tick = () => {
          const c = store.cursor;
          for (const m of mags) {
            const r = m.el.getBoundingClientRect();
            // Rest position: the rect minus the offset we applied ourselves
            const cx = r.left + r.width / 2 - Number(gsap.getProperty(m.el, "x"));
            const cy = r.top + r.height / 2 - Number(gsap.getProperty(m.el, "y"));
            const dx = c.x - cx;
            const dy = c.y - cy;
            const near = c.active && Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 70;
            if (near) {
              m.x(dx * 0.35);
              m.y(dy * 0.35);
              m.on = true;
            } else if (m.on) {
              m.x(0);
              m.y(0);
              m.on = false;
            }
          }
        };
        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });
    };

    // Line splitting needs the final font metrics
    document.fonts.ready.then(init);

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return null;
}
