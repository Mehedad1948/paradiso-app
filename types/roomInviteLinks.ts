export interface RoomInviteLink {
  id: number;
  roomId: number;
  token: string;
  inviteUrl: string;
  isActive: boolean;
  maxUsage?: number | null;
  usageCount: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    username: string;
    avatar?: string | null;
  };
}

export interface CreateRoomInviteLinkInputs {
  roomId: number | string;
  maxUsage?: number;
  expiresAt?: string;
  note?: string;
}

export interface UpdateRoomInviteLinkInputs {
  roomId: number | string;
  id: string;
  isActive?: boolean;
  maxUsage?: number;
  expiresAt?: string;
  note?: string;
}
