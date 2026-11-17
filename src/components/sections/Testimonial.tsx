import { testimonial } from "@/lib/content";

/** Renders nothing until a real, approved quote is added in src/lib/content.ts */
export default function Testimonial() {
  if (!testimonial) return null;
  return (
    <section className="wrap border-t border-line py-[clamp(5rem,12vw,11.25rem)]">
      <p className="label" data-reveal>
        a note from a client
      </p>
      <blockquote data-reveal className="mt-8">
        <p className="max-w-[26ch] text-[clamp(1.625rem,4vw,3.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
          “{testimonial.quote}”
        </p>
        <footer className="mt-8 text-[1.0625rem]">
          {testimonial.name}
          <span className="label ml-3">{testimonial.title}</span>
        </footer>
      </blockquote>
    </section>
  );
}
