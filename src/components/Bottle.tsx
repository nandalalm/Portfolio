"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "floating" | "open" | "sent";

/**
 * Message in a bottle. It floats on the contact water; opening it shows a
 * short note form. Sending hands the note to the visitor's own email app
 * (there is no server), and the bottle drifts away.
 */
export default function Bottle({ email }: { email: string }) {
  const [phase, setPhase] = useState<Phase>("floating");
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const open = () => {
    setPhase("open");
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    setPhase((p) => (p === "open" ? "floating" : p));
  };

  const send = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = `A note from ${name || "your portfolio"}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    dialog.current?.close();
    setPhase("sent");
    // A fresh bottle washes back in after a while
    timer.current = window.setTimeout(() => setPhase("floating"), 9000);
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        data-gl-buoy
        aria-label="Send a message in a bottle"
        className={`bottle ${phase === "sent" ? "is-sent" : ""}`}
      >
        <svg viewBox="0 0 64 120" fill="none" aria-hidden="true">
          <rect x="24" y="2" width="16" height="12" rx="3" fill="#c9a36b" />
          <path
            d="M25 14h14v14c0 6 11 10 11 24v52a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10V52c0-14 11-18 11-24V14Z"
            fill="rgb(127 180 255 / 0.14)"
            stroke="rgb(190 220 255 / 0.75)"
            strokeWidth="2"
          />
          <rect x="24" y="58" width="16" height="40" rx="3" fill="#e8ecf2" opacity="0.9" />
          <path d="M24 70h16M24 78h16M24 86h10" stroke="#06080c" strokeWidth="1.5" opacity="0.45" />
          <path d="M20 52c0-9 5-13 7-18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        </svg>
        <span className="label mt-2 block">message in a bottle</span>
      </button>

      <p aria-live="polite" className={`bottle-note label ${phase === "sent" ? "is-on" : ""}`}>
        Your note is on its way. If your email app didn&rsquo;t open, write to {email}.
      </p>

      <dialog ref={dialog} onClose={close} data-lenis-prevent className="bottle-dialog">
        <form onSubmit={send} className="flex flex-col gap-5 text-left">
          <div>
            <h3 className="text-[1.75rem] font-medium tracking-[-0.01em]">Put a note in the bottle</h3>
            <p className="mt-2 text-[0.9375rem] text-muted">
              Send opens your email app with the note filled in, ready to go.
            </p>
          </div>
          <label className="flex flex-col gap-2">
            <span className="label">your name</span>
            <input name="name" autoComplete="name" className="bottle-field" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="label">your note</span>
            <textarea name="message" required rows={5} className="bottle-field resize-none" />
          </label>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-full px-5 py-2.5 text-[0.9375rem] text-muted transition-colors hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-2.5 text-[0.9375rem] font-medium text-bg transition-colors hover:bg-accent"
            >
              Seal and send →
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
