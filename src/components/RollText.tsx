/**
 * Text whose letters roll up to a copy of themselves when an ancestor with
 * the `group` class is hovered, each letter slightly after the last.
 * Put the readable text in an aria-label on the parent; these spans are decorative.
 */
export default function RollText({ text }: { text: string }) {
  return (
    <span className="roll" aria-hidden="true">
      {[...text].map((ch, i) => {
        const c = ch === " " ? " " : ch;
        return (
          <span key={i} className="roll-c" style={{ "--i": i } as React.CSSProperties}>
            <span>{c}</span>
            <span>{c}</span>
          </span>
        );
      })}
    </span>
  );
}
