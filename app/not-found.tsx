import type { Metadata } from "next";
import ErrorScreen, { ScreenAction } from "@/components/ui/ErrorScreen";

export const metadata: Metadata = { title: "Scene not found" };

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      kicker="Reel 404 · Scene not found"
      title="This scene never made the final cut."
      actions={
        <ScreenAction href="/" primary>
          Back to the lobby
        </ScreenAction>
      }
    >
      Left on the cutting-room floor, or never shot at all.
    </ErrorScreen>
  );
}
