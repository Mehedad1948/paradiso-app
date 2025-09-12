import { User } from "./user";

export type InvitationStatusesType = "pending" | "accepted" | "declined" | "expired";

export interface Invitation {
  id: number;
  invitedBy: Pick<User, "avatar" | "email" | "id">;
  email: string;
  status: InvitationStatusesType;
}
