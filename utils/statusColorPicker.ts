import { InvitationStatusesType } from "@/types/invitations";
import { UseChipProps } from "@heroui/chip/dist/use-chip";

const statuses: Record<InvitationStatusesType, UseChipProps["color"]> = {
  pending: "secondary",
  accepted: "success",
  declined: "danger",
  expired: "warning",
};

export function statusColorPicker(status: string): UseChipProps["color"] {
  if (status in statuses) {
    return statuses[status as InvitationStatusesType];
  }
  return "default";
}
