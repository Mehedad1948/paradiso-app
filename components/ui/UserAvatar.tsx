import Link from "next/link";
import { Avatar, type AvatarProps } from "@heroui/avatar";
import { avatarGradient } from "./avatarGradient";

/** Named sizes, in px. Pass a number for anything off the scale. */
const SIZES = { xs: 24, sm: 36, md: 44, lg: 64, xl: 88 } as const;

export type UserAvatarSize = keyof typeof SIZES | number;

const initial = (name: string) =>
  (/[a-z0-9]/i.exec(name)?.[0] || name.charAt(0) || "?").toUpperCase();

type UserAvatarProps = {
  /** Display name: drives the initial and the placeholder gradient. */
  name?: string | null;
  /** Photo URL. Without one, the initial sits on a gradient drawn from the name. */
  src?: string | null;
  size?: UserAvatarSize;
  /** Makes the avatar a link (e.g. to the member's profile). */
  href?: string;
} & Omit<AvatarProps, "src" | "name" | "size">;

/** The one avatar used wherever a person is shown. */
export default function UserAvatar({
  name,
  src,
  size = "md",
  href,
  style,
  ...props
}: UserAvatarProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  const label = name?.trim() || "Member";

  const avatar = (
    <Avatar
      src={src || undefined}
      name={label}
      title={label}
      getInitials={initial}
      // A broken photo URL falls back to the initial instead of an empty circle.
      showFallback
      {...props}
      className={src ? props.className : `avatar-placeholder ${props.className ?? ""}`}
      style={{
        width: px,
        height: px,
        minWidth: px,
        fontSize: Math.round(px * 0.4),
        fontWeight: 600,
        ...(src ? null : avatarGradient(label)),
        ...style,
      }}
    />
  );

  if (!href) return avatar;

  return (
    <Link
      href={href}
      aria-label={`${label}'s profile`}
      className="block shrink-0 self-start rounded-full transition-opacity hover:opacity-85"
    >
      {avatar}
    </Link>
  );
}
