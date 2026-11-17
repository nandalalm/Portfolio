"use client";

import { usePathname } from "next/navigation";
import { site } from "@/lib/content";
import { store } from "@/lib/store";

const items = [
  { label: "Work", hash: "#work" },
  { label: "Journey", hash: "#journey" },
  { label: "About", hash: "#about" },
  { label: "Contact", hash: "#contact" },
];

export default function Nav() {
  const home = usePathname() === "/";

  // On the home page Lenis glides to the section. From a case study, the link
  // goes home through the page transition (Contact exists on every page).
  const go = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    const here = home || hash === "#contact";
    if (here && store.lenis) {
      e.preventDefault();
      store.lenis.scrollTo(hash, { duration: 1.4 });
      history.replaceState(null, "", hash);
    } else if (!here && store.navigate) {
      e.preventDefault();
      store.navigate(hash === "#top" ? "/" : `/${hash}`);
    }
  };
  const href = (hash: string) => (home || hash === "#contact" ? hash : hash === "#top" ? "/" : `/${hash}`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-bg/90 via-bg/50 to-transparent pb-6">
      <nav className="wrap flex items-center justify-between py-5" aria-label="Main">
        <a href={href("#top")} onClick={(e) => go(e, "#top")} className="font-mono text-[0.8125rem] text-ink">
          <span className="hidden sm:inline">{site.domainLabel}</span>
          <span className="sm:hidden" aria-label={site.domainLabel}>
            nm.
          </span>
        </a>
        <ul className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1 backdrop-blur-md">
          {items.map((it) => (
            <li key={it.hash}>
              <a
                href={href(it.hash)}
                onClick={(e) => go(e, it.hash)}
                className="block rounded-full px-2.5 py-1.5 text-[0.75rem] text-muted transition-colors duration-[var(--dur-fast)] hover:bg-white/10 hover:text-ink sm:px-4 sm:text-[0.8125rem]"
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
