import { stack } from "@/lib/content";

export default function Stack() {
  return (
    <section className="wrap border-t border-line py-[clamp(5rem,12vw,11.25rem)]">
      <p className="label" data-reveal>
        03 / how I build
      </p>
      <h2
        data-split
        className="mt-4 max-w-[16ch] text-[clamp(2rem,5vw,4.5rem)] font-medium leading-[1] tracking-[-0.02em]"
      >
        The whole path, from interface to infrastructure.
      </h2>

      <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {stack.map((g, i) => (
          <div key={g.group} data-reveal data-reveal-delay={i * 0.08} className="border-t border-line pt-5">
            <h3 className="label text-accent">{g.group.toLowerCase()}</h3>
            <ul className="mt-5 space-y-2 text-[1.1875rem]">
              {g.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
