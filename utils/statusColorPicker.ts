import type { ChipProps } from "@heroui/chip";
import type { InvitationStatus } from "@/types/invitations";

/** Chip color and wording for every invitation status. */
export const invitationStatus: Record<InvitationStatus, { label: string; color: ChipProps["color"] }> = {
  awaiting_approval: { label: "Needs approval", color: "warning" },
  pending: { label: "Pending", color: "secondary" },
  accepted: { label: "Accepted", color: "success" },
  declined: { label: "Declined", color: "danger" },
  rejected: { label: "Rejected", color: "danger" },
  cancelled: { label: "Cancelled", color: "default" },
  expired: { label: "Expired", color: "default" },
};

export function statusColorPicker(status: string): ChipProps["color"] {
  return status in invitationStatus ? invitationStatus[status as InvitationStatus].color : "default";
}
