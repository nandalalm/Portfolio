import JourneyStream from "@/components/JourneyStream";
import { journey } from "@/lib/content";

export default function Journey() {
  return (
    <section id="journey" className="wrap scroll-mt-24 border-t border-line py-[clamp(5rem,12vw,11.25rem)]">
      <p className="label" data-reveal>
        04 / journey
      </p>
      <h2
        data-split
        className="mt-4 text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1] tracking-[-0.02em]"
      >
        The path so far.
      </h2>

      <ol className="relative mt-14 ml-4 border-l border-line">
        <JourneyStream />
        {journey.map((j) => (
          <li key={j.title} data-reveal className="relative pb-12 pl-8 last:pb-0 md:pl-14">
            <span
              data-journey-dot
              aria-hidden="true"
              className="absolute -left-[0.3125rem] top-2 size-[0.5625rem] rounded-full bg-muted"
            />
            <p className="label">{j.when}</p>
            <h3 className="mt-2 text-[clamp(1.375rem,2.6vw,2.125rem)] font-medium tracking-[-0.01em]">{j.title}</h3>
            <p className="mt-2 max-w-[52ch] text-[1.0625rem] text-muted">{j.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
