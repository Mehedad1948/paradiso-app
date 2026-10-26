import clsx from "clsx";
import { avatarGradient } from "@/components/ui/avatarGradient";

/** A room's cover as a small rounded tile; its initial on a name-tinted gradient without one. */
export default function RoomThumb({
  name,
  image,
  size = 44,
  className,
}: {
  name: string;
  image: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.28) };
  if (image)
    return (
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        style={style}
        className={clsx("shrink-0 border border-line object-cover", className)}
      />
    );
  return (
    <span
      aria-hidden="true"
      style={{ ...style, ...avatarGradient(name), fontSize: size * 0.4 }}
      className={clsx(
        "avatar-placeholder flex shrink-0 items-center justify-center border border-line font-semibold text-ink",
        className,
      )}
    >
      {(/[a-z0-9]/i.exec(name)?.[0] || name.charAt(0) || "?").toUpperCase()}
    </span>
  );
}
