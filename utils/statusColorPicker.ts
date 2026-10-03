import { InvitationStatusesType } from "@/types/invitations";
import type { ChipProps } from "@heroui/chip";

const statuses: Record<InvitationStatusesType, ChipProps["color"]> = {
  pending: "secondary",
  accepted: "success",
  declined: "danger",
  expired: "warning",
};

export function statusColorPicker(status: string): ChipProps["color"] {
  if (status in statuses) {
    return statuses[status as InvitationStatusesType];
  }
  return "default";
}
