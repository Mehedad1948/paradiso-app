export const panelKeys = {
  me: ["me"] as const,
  rooms: ["rooms"] as const,
  room: (id: string) => ["room", id, "detail"] as const,
  ratings: (id: string) => ["room", id, "ratings"] as const,
  invitations: (id: string) => ["room", id, "invitations"] as const,
  links: (id: string) => ["room", id, "invite-links"] as const,
};
