import type { AvatarProps } from "@heroui/avatar";
import ChatAvatar from "@/features/rooms/chat/components/ChatAvatar";
import type { CommunityUser } from "@/types/community";
import { userHue } from "../format";

/** Member avatar whose initial sits on that member's own color. */
export default function TintedAvatar({
  user,
  ...props
}: { user: CommunityUser } & Omit<AvatarProps, "src" | "name">) {
  const hue = userHue(user.id);
  return (
    <ChatAvatar
      user={user}
      style={{ backgroundColor: `hsl(${hue} 55% 46%)`, color: "#fff" }}
      {...props}
    />
  );
}
