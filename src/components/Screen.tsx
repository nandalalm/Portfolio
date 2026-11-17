type Props = {
  id: string;
  title: string;
  color: string;
  variant?: "browser" | "phone";
  className?: string;
};

/**
 * Where a project's looping screen recording will play.
 * Until the WebGL layer and the recordings land, this draws a quiet stand-in
 * tinted with the project's colour. `data-gl` is what the canvas will track.
 */
export default function Screen({ id, title, color, variant = "browser", className = "" }: Props) {
  const phone = variant === "phone";
  return (
    <div
      data-gl-plane={id}
      data-variant={phone ? "phone" : "browser"}
      className={`relative overflow-hidden border border-line bg-surface ${
        phone ? "aspect-[9/19] rounded-[1.375rem]" : "aspect-[16/10] rounded-xl"
      } ${className}`}
      style={{
        backgroundImage: `radial-gradient(120% 100% at 0% 0%, ${color}38 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, ${color}1f 0%, transparent 65%)`,
      }}
    >
      {!phone && (
        <div className="flex h-7 items-center gap-1.5 border-b border-line px-3">
          <i className="size-1.5 rounded-full bg-white/20" />
          <i className="size-1.5 rounded-full bg-white/20" />
          <i className="size-1.5 rounded-full bg-white/20" />
        </div>
      )}
      <div className={`absolute inset-x-0 ${phone ? "top-[12%] px-3" : "top-[26%] px-[7%]"}`}>
        <div className="h-[clamp(0.5rem,1.4vw,1rem)] w-[58%] rounded-sm bg-white/80" />
        <div
          className="mt-[6%] h-[clamp(0.5rem,1.4vw,1rem)] w-[36%] rounded-sm"
          style={{ background: color }}
        />
        <div className="mt-[9%] h-1.5 w-[72%] rounded-sm bg-white/15" />
        <div className="mt-2 h-1.5 w-[54%] rounded-sm bg-white/15" />
      </div>
      <span className="label absolute bottom-3 left-3 text-[0.6875rem]">
        {phone ? "app" : `${title.toLowerCase()} · recording`}
      </span>
    </div>
  );
}
