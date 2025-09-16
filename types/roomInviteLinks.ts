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
  uses: number;
  createdBy: {
    id: number;
    username: string;
    avatar?: string | null;
  };
}

export interface CreateRoomInviteLinkInputs {
  roomId: number | string;
  maxUsage?: number;
  expiresAt?: Date;
  note?: string;
}

export interface UpdateRoomInviteLinkInputs {
  roomId: number | string;
  id: string | number;
  isActive?: boolean;
  maxUsage?: number;
  expiresAt?: Date;
  note?: string;
}
export interface DeleteRoomInviteLinkInputs {
  roomId: number | string;
  id: string | number;
}

export interface InviteLinkInfo {
  room: {
    id: string | number;
    name: string;
    description: string;
    image?: string;
  };
  inviter: {
    id: string | number;
    name: string;
    avatar: string;
  } | null;
  canJoin: boolean;
  message: string;
}
