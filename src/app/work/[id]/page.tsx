import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Architecture from "@/components/Architecture";
import Nav from "@/components/Nav";
import Reveals from "@/components/Reveals";
import RollText from "@/components/RollText";
import TransitionLink from "@/components/TransitionLink";
import Contact from "@/components/sections/Contact";
import { Media, Tags } from "@/components/sections/Work";
import { projects } from "@/lib/content";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/work/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = projects.find((x) => x.id === id);
  return p ? { title: `${p.title} · Nandalal M`, description: p.description } : {};
}

const sectionClass = "wrap border-t border-line py-[clamp(4.5rem,10vw,9rem)]";
const headingClass = "mt-4 text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1] tracking-[-0.02em]";

/**
 * The body reads the URL, so it sits inside Suspense: the shell of the route
 * can then be shared and prefetched, and navigation stays instant.
 */
export default function CaseStudyPage({ params }: PageProps<"/work/[id]">) {
  return (
    <Suspense fallback={null}>
      <CaseStudy params={params} />
    </Suspense>
  );
}

async function CaseStudy({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = projects.findIndex((p) => p.id === id);
  if (index < 0) notFound();
  const p = projects[index];
  const next = projects[(index + 1) % projects.length];
  const cs = p.caseStudy;

  return (
    <>
      <Nav />
      <main>
        {/* The project's colour tints the water; the title is refracted in it */}
        <section
          data-gl="water"
          data-fade="bottom"
          data-tint={p.color}
          className="water-still relative flex min-h-[86svh] flex-col justify-end overflow-hidden"
        >
          <div className="wrap w-full pb-[clamp(4rem,9vw,8rem)]">
            <p className="line-mask label">
              <span style={{ "--d": "0.2s" } as React.CSSProperties}>
                case study · <span style={{ color: p.color }}>{p.kind.toLowerCase()}</span>
              </span>
            </p>
            <h1
              data-gl-text
              className="mt-3 w-fit whitespace-nowrap text-[clamp(3rem,13vw,13rem)] font-bold leading-[0.95] tracking-[-0.035em]"
            >
              {p.title}
            </h1>
            <p className="line-mask mt-5 max-w-[44ch] text-[clamp(1.0625rem,1.6vw,1.375rem)] text-ink/85">
              <span style={{ "--d": "0.45s" } as React.CSSProperties}>{p.description}</span>
            </p>
          </div>
        </section>

        <section className="wrap grid gap-x-[6vw] gap-y-12 py-[clamp(4.5rem,10vw,9rem)] md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label" data-reveal>
              01 / the brief
            </p>
            <p
              data-split
              className="mt-5 text-[clamp(1.5rem,2.9vw,2.625rem)] font-medium leading-[1.15] tracking-[-0.015em]"
            >
              {cs.summary}
            </p>
          </div>
          <div className="group md:col-span-4 md:col-start-9" data-reveal>
            <p className="label">role</p>
            <p className="mt-2 text-[1.125rem]">{cs.role}</p>
            {p.stats && (
              <dl className="mt-8 flex gap-10">
                {p.stats.map((s) => (
                  <div key={s.label}>
                    <dt data-count className="text-[2.5rem] font-medium leading-none">
                      {s.value}
                    </dt>
                    <dd className="label mt-2">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="label mt-8">stack</p>
            <div className="-mt-3">
              <Tags tags={p.tags} />
            </div>
            {p.links && (
              <p className="mt-8 flex flex-wrap gap-5">
                {p.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.9375rem] underline decoration-white/25 underline-offset-[0.375rem] transition-colors duration-[var(--dur-fast)] hover:text-accent hover:decoration-accent"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </p>
            )}
          </div>
        </section>

        <section className="wrap pb-[clamp(4.5rem,10vw,9rem)]">
          <div data-reveal className="mx-auto max-w-[62rem]">
            <Media p={p} />
          </div>
        </section>

        <section className={sectionClass}>
          <p className="label" data-reveal>
            02 / what I built
          </p>
          <h2 data-split className={headingClass}>
            The work.
          </h2>
          <ol className="mt-12 grid gap-x-[6vw] md:grid-cols-2">
            {cs.built.map((b, i) => (
              <li key={i} data-reveal data-reveal-delay={(i % 2) * 0.08} className="flex gap-5 border-t border-line py-6">
                <span className="label pt-1" style={{ color: p.color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[1.0625rem] leading-relaxed">{b}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={sectionClass}>
          <p className="label" data-reveal>
            03 / architecture
          </p>
          <h2 data-split className={headingClass}>
            What a request passes through.
          </h2>
          <div className="mt-10">
            <Architecture layers={cs.layers} color={p.color} />
          </div>
        </section>

        <section className={sectionClass}>
          <p className="label" data-reveal>
            04 / the hard parts
          </p>
          <h2 data-split className={headingClass}>
            Where the thinking went.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {cs.hard.map((h, i) => (
              <article
                key={h.title}
                data-reveal
                data-reveal-delay={(i % 2) * 0.08}
                className="rounded-2xl border border-line bg-white/[0.02] p-7"
              >
                <h3 className="text-[1.5rem] font-medium tracking-[-0.01em]">{h.title}</h3>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted">{h.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${sectionClass} group`}>
          <p className="label" data-reveal>
            next project
          </p>
          <TransitionLink
            href={`/work/${next.id}`}
            data-cursor="view"
            aria-label={`Next project: ${next.title}`}
            className="mt-4 block w-fit text-[clamp(3rem,11vw,11rem)] font-bold leading-none tracking-[-0.035em]"
          >
            <RollText text={next.title} />
            <span className="ml-[0.15em] inline-block text-[0.6em] transition-transform duration-[var(--dur-base)] ease-flow group-hover:translate-x-[0.2em]" style={{ color: next.color }}>
              →
            </span>
          </TransitionLink>
        </section>
      </main>
      <Contact />
      <Reveals />
    </>
  );
}
