import Link from "next/link";
import type { AvatarProps } from "@heroui/avatar";
import TintedAvatar from "./TintedAvatar";
import type { CommunityUser } from "@/types/community";
import { profileHref } from "../format";

/** Avatar that opens the member's profile. */
export default function UserAvatar({
  user,
  className = "h-11 w-11",
  ...props
}: { user: CommunityUser; className?: string } & Omit<AvatarProps, "src" | "name">) {
  return (
    <Link
      href={profileHref(user.id)}
      aria-label={`${user.username}'s profile`}
      className="block shrink-0 self-start rounded-full transition-opacity hover:opacity-85"
    >
      <TintedAvatar user={user} className={className} {...props} />
    </Link>
  );
}
