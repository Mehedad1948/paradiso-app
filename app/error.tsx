"use client";

import { useEffect } from "react";
import ErrorScreen, { ScreenAction } from "@/components/ui/ErrorScreen";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <>
      <title>Intermission | Paradiso</title>
      <ErrorScreen
        code="500"
        kicker="Reel 500 · Projector jammed"
        title="The film snapped in the gate."
        note={error.digest ? `Reel ref · ${error.digest}` : undefined}
        actions={
          <>
            <ScreenAction onClick={retry} primary>
              Rewind and try again
            </ScreenAction>
            <ScreenAction href="/">Back to the lobby</ScreenAction>
          </>
        }
      >
        Our projectionist is splicing the reel back together.
      </ErrorScreen>
    </>
  );
}
