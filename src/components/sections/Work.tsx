import RollText from "@/components/RollText";
import Screen from "@/components/Screen";
import TransitionLink from "@/components/TransitionLink";
import { projects, type Project } from "@/lib/content";

export function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {tags.map((t, i) => (
        <li
          key={t}
          style={{ "--i": i } as React.CSSProperties}
          className="tag rounded-full border border-line px-3 py-1 font-mono text-[0.6875rem] text-muted"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

const linkClass =
  "text-[0.9375rem] underline decoration-white/25 underline-offset-[0.375rem] transition-colors duration-[var(--dur-fast)] hover:text-accent hover:decoration-accent";

function Copy({ p, index }: { p: Project; index: number }) {
  return (
    <div data-reveal data-reveal-delay={0.08}>
      <p className="label">
        <span style={{ color: p.color }}>{String(index + 1).padStart(2, "0")}</span> · {p.kind}
      </p>
      <h3 className="mt-3 text-[clamp(2.125rem,5vw,4.5rem)] font-medium tracking-[-0.02em]">
        <TransitionLink href={`/work/${p.id}`} aria-label={`${p.title} case study`}>
          <RollText text={p.title} />
        </TransitionLink>
      </h3>
      <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-muted">{p.description}</p>
      <p className="mt-4 max-w-[46ch] border-l-2 pl-4 text-[0.9375rem] leading-relaxed" style={{ borderColor: p.color }}>
        {p.highlight}
      </p>

      {p.stats && (
        <dl className="mt-7 flex gap-10">
          {p.stats.map((s) => (
            <div key={s.label}>
              <dt data-count className="text-3xl font-medium">
                {s.value}
              </dt>
              <dd className="label mt-1">{s.label}</dd>
            </div>
          ))}
        </dl>
      )}

      <Tags tags={p.tags} />

      <p className="mt-7 flex flex-wrap gap-5">
        <TransitionLink href={`/work/${p.id}`} className={linkClass}>
          Case study →
        </TransitionLink>
        {p.links?.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={linkClass}>
            {l.label} ↗
          </a>
        ))}
      </p>
    </div>
  );
}

export function Media({ p }: { p: Project }) {
  return p.featured ? (
    <div className="relative pb-[8%] pr-[14%]">
      <Screen id={p.id} title={p.title} color={p.color} />
      <Screen
        id={p.id}
        title={p.title}
        color={p.color}
        variant="phone"
        className="!absolute bottom-0 right-0 w-[24%] shadow-[0_1.25rem_3.75rem_rgba(0,0,0,.6)]"
      />
    </div>
  ) : (
    <Screen id={p.id} title={p.title} color={p.color} />
  );
}

export default function Work() {
  return (
    <section id="work" className="wrap scroll-mt-24 pb-[clamp(5rem,12vw,11.25rem)]">
      <p className="label" data-reveal>
        02 / selected work
      </p>
      <h2
        data-split
        className="mt-4 text-[clamp(2.5rem,7vw,7rem)] font-medium leading-[0.95] tracking-[-0.03em]"
      >
        Shipped, not just built.
      </h2>

      <div className="mt-[clamp(3rem,8vw,6.875rem)] flex flex-col gap-[clamp(4.5rem,11vw,10.625rem)]">
        {projects.map((p, i) => (
          <article
            key={p.id}
            id={p.id}
            className="group grid items-center gap-x-[6vw] gap-y-10 md:grid-cols-12"
          >
            <div data-reveal className={`relative md:col-span-7 ${i % 2 ? "md:order-2" : ""}`}>
              <TransitionLink
                href={`/work/${p.id}`}
                data-cursor="view"
                aria-label={`${p.title} case study`}
                tabIndex={-1}
                className="block"
              >
                <Media p={p} />
              </TransitionLink>
            </div>
            <div className="md:col-span-5">
              <Copy p={p} index={i} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
