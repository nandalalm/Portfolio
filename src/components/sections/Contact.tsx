import Bottle from "@/components/Bottle";
import { site } from "@/lib/content";

export default function Contact() {
  return (
    <footer
      id="contact"
      data-gl="water"
      data-fade="top"
      className="water-still relative z-10 flex min-h-[100svh] scroll-mt-0 flex-col items-center justify-center overflow-hidden px-5 text-center"
    >
      <p className="label" data-reveal>
        06 / contact
      </p>
      <h2
        data-split
        className="mt-6 text-[clamp(2.75rem,9vw,9.375rem)] font-medium leading-[0.95] tracking-[-0.03em]"
      >
        Let&rsquo;s build
        <br />
        something.
      </h2>

      {/* Reveal on the wrapper, magnet on the button: two tweens must not fight over one transform */}
      <div data-reveal className="mt-12">
        <a
          data-magnetic
          href={`mailto:${site.email}`}
          className="inline-block rounded-full bg-ink px-8 py-4 text-[1.0625rem] font-medium text-bg transition-colors duration-[var(--dur-fast)] hover:bg-accent"
        >
          {site.email} →
        </a>
      </div>

      <ul data-reveal className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
        {site.links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="text-[0.9375rem] text-muted transition-colors duration-[var(--dur-fast)] hover:text-ink"
            >
              {l.label} ↗
            </a>
          </li>
        ))}
        {site.resumeUrl && (
          <li>
            <a href={site.resumeUrl} download className="text-[0.9375rem] text-muted hover:text-ink">
              Resume ↓
            </a>
          </li>
        )}
      </ul>

      <Bottle email={site.email} />

      <p className="label absolute inset-x-0 bottom-6">
        {site.name} · built with Next.js, GSAP and WebGL
      </p>
    </footer>
  );
}
