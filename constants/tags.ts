// constants/tags.ts
export const NEXT_TAGS = {
  ROOM_RATINGS: "room-ratings",
  INVITATIONS: "invitations",
} as const;

export type TagKey = keyof typeof NEXT_TAGS;
export type TagValue = (typeof NEXT_TAGS)[TagKey];
