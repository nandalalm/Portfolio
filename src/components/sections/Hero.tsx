import { site } from "@/lib/content";

export default function Hero() {
  return (
    <section
      id="top"
      data-gl="water"
      data-fade="bottom"
      data-blob
      data-intro
      className="water-still relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden"
    >
      <h1
        data-gl-text
        aria-label={site.name}
        className="select-none text-center text-[clamp(3.5rem,15.5vw,14.375rem)] font-bold uppercase leading-[0.9] tracking-[-0.03em]"
      >
        {/* Each letter rises on its own, slightly after the last */}
        <span className="line-mask" aria-hidden="true">
          {[...site.shortName].map((ch, i) => (
            <span key={i} style={{ "--d": `${0.15 + i * 0.045}s` } as React.CSSProperties}>
              {ch}
            </span>
          ))}
        </span>
      </h1>

      <div className="absolute inset-x-0 bottom-9 px-5 text-center">
        <p className="line-mask text-[clamp(0.9375rem,2vw,1.25rem)] font-medium">
          <span style={{ "--d": "0.7s" } as React.CSSProperties}>{site.role}</span>
        </p>
        <p className="line-mask label mt-2">
          <span style={{ "--d": "0.85s" } as React.CSSProperties}>scroll ↓</span>
        </p>
      </div>
    </section>
  );
}
