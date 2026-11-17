"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { store } from "@/lib/store";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** A Next.js link that plays the liquid page transition instead of cutting. */
export default function TransitionLink({ href, onClick, ...rest }: Props) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        // Leave new-tab clicks and no-JS behaviour alone
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (!store.navigate) return;
        e.preventDefault();
        store.navigate(href);
      }}
    />
  );
}
