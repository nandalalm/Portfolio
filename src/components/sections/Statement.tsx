import { projects, site } from "@/lib/content";

export default function Statement() {
  const edu = projects.find((p) => p.id === "edusolve");
  const facts = [
    { value: "2", label: "platforms: web and mobile" },
    { value: "1", label: "client product, live" },
    ...(edu?.stats ?? []),
  ];

  return (
    <section className="wrap py-[clamp(5.625rem,16vw,13.75rem)]">
      <p className="label" data-reveal>
        01 / hello
      </p>
      <p
        data-split
        className="mt-6 max-w-[18ch] text-[clamp(1.875rem,5.4vw,5.25rem)] font-medium leading-[1.04] tracking-[-0.02em] sm:max-w-[20ch]"
      >
        {site.statement}
      </p>

      <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-line pt-8 md:grid-cols-4">
        {facts.map((f, i) => (
          <div key={f.label} data-reveal data-reveal-delay={i * 0.08}>
            <dt data-count className="text-[clamp(2rem,4vw,3.5rem)] font-medium leading-none">{f.value}</dt>
            <dd className="label mt-3">{f.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
