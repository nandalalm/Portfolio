import { about, site } from "@/lib/content";

export default function About() {
  const initials = site.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <section id="about" className="wrap scroll-mt-24 border-t border-line py-[clamp(5rem,12vw,11.25rem)]">
      <p className="label" data-reveal>
        05 / about
      </p>

      <div className="mt-10 grid items-start gap-x-[6vw] gap-y-12 md:grid-cols-12">
        {/* data-gl="portrait": the canvas draws this as a reflection on water */}
        <div
          data-reveal
          data-gl="portrait"
          data-initials={initials}
          data-photo={about.photo ?? undefined}
          className="water-still relative aspect-[4/5] overflow-hidden rounded-xl border border-line md:col-span-4"
        >
          {about.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={about.photo} alt={`Portrait of ${site.name}`} className="size-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[clamp(3.5rem,9vw,7.5rem)] font-bold tracking-[-0.04em] text-white/15">
              {initials}
            </span>
          )}
        </div>

        <div className="md:col-span-8">
          {about.paragraphs.map((p, i) => (
            <p
              key={i}
              data-reveal
              data-reveal-delay={i * 0.08}
              className={
                i === 0
                  ? "max-w-[30ch] text-[clamp(1.5rem,3.2vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.015em]"
                  : "mt-8 max-w-[56ch] text-[1.125rem] leading-relaxed text-muted"
              }
            >
              {p}
            </p>
          ))}

          {site.resumeUrl && (
            <a
              data-reveal
              href={site.resumeUrl}
              download
              className="mt-10 inline-block rounded-full border border-line px-6 py-3 text-[0.9375rem] transition-colors duration-[var(--dur-fast)] hover:border-accent hover:text-accent"
            >
              Download resume ↓
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
