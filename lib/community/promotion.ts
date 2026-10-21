import { panelApi } from "@/lib/api/panel";
import type { RoomInviteLink } from "@/types/roomInviteLinks";

const usable = (link: RoomInviteLink, now: number) =>
  link.isActive &&
  (!link.expiresAt || Date.parse(link.expiresAt) > now) &&
  // 0 means unlimited uses.
  (!link.maxUsage || link.uses < link.maxUsage);

/** Reuses one of the room's working invite links, or creates one, for a promoted post. */
export async function promotionToken(roomId: number) {
  const links = await panelApi.inviteLinks(String(roomId), 1);
  const now = Date.now();
  const existing = links.data.find((link) => usable(link, now));
  if (existing) return { token: existing.token, created: false };
  const created = await panelApi.createInviteLink(String(roomId));
  return { token: created.token, created: true };
}
