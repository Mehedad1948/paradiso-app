import { Avatar, type AvatarProps } from "@heroui/avatar";
import type { PublicUser } from "@/types/chat";

const initial = (name: string) => (/[a-z0-9]/i.exec(name)?.[0] || name.charAt(0) || "?").toUpperCase();

/** Member avatar with a single initial, which stays legible at chat sizes. */
export default function ChatAvatar({
  user,
  ...props
}: { user: Pick<PublicUser, "username" | "avatar"> } & Omit<AvatarProps, "src" | "name">) {
  return (
    <Avatar
      src={user.avatar ?? undefined}
      name={user.username}
      title={user.username}
      getInitials={initial}
      {...props}
    />
  );
}
