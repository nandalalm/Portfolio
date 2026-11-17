"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "@/lib/motion";
import { store } from "@/lib/store";

/**
 * Liquid page transition. A sheet of deep water rises with a curved surface,
 * the route changes underneath it, and the sheet drains away upwards.
 * Links opt in through TransitionLink, which calls store.navigate().
 */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const pending = useRef<{ hash: string } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    store.navigate = (href) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      // Same page: just glide to the section
      if (url.pathname === window.location.pathname) {
        if (url.hash) store.lenis?.scrollTo(url.hash, { duration: 1.4 });
        return;
      }
      if (reduce || busy.current || !path.current || !wrap.current) {
        router.push(url.pathname + url.hash);
        return;
      }

      busy.current = true;
      pending.current = { hash: url.hash };
      wrap.current.style.visibility = "visible";
      store.lenis?.stop();

      // Rise: the top edge climbs from the bottom, bulging in the middle
      const s = { y: 100 };
      gsap.to(s, {
        y: 0,
        duration: motion.dur.base,
        ease: "power3.inOut",
        onUpdate: () => {
          const c = Math.sin((1 - s.y / 100) * Math.PI) * 26;
          path.current!.setAttribute("d", `M0 ${s.y} Q50 ${s.y - c} 100 ${s.y} L100 100 L0 100 Z`);
        },
        onComplete: () => router.push(url.pathname),
      });
    };

    return () => {
      store.navigate = null;
    };
  }, [router]);

  // The new page has rendered underneath: reset scroll, then drain the sheet away
  useEffect(() => {
    const job = pending.current;
    pending.current = null;
    if (!job) {
      ScrollTrigger.refresh();
      return;
    }

    const raf = requestAnimationFrame(() => {
      store.lenis?.start();
      store.lenis?.scrollTo(job.hash || 0, { immediate: true, force: true });
      store.gl?.scan();
      ScrollTrigger.refresh();

      const s = { b: 100 };
      gsap.to(s, {
        b: 0,
        duration: motion.dur.base,
        ease: "power3.inOut",
        delay: 0.1,
        onUpdate: () => {
          const c = Math.sin((1 - s.b / 100) * Math.PI) * 26;
          path.current?.setAttribute("d", `M0 0 L100 0 L100 ${s.b} Q50 ${s.b + c} 0 ${s.b} Z`);
        },
        onComplete: () => {
          if (wrap.current) wrap.current.style.visibility = "hidden";
          busy.current = false;
        },
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <div ref={wrap} aria-hidden="true" className="fixed inset-0 z-[80]" style={{ visibility: "hidden" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <path ref={path} fill="#04162e" d="M0 100 L100 100 L0 100 Z" />
      </svg>
    </div>
  );
}
