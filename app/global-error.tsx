"use client";

import "@/styles/globals.css";
import { useEffect } from "react";
import ErrorScreen, { ScreenAction } from "@/components/ui/ErrorScreen";

/**
 * Replaces the root layout when it fails, so it brings its own document and
 * styles and avoids the app router: both actions are plain page loads.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <title>Intermission | Paradiso</title>
        <ErrorScreen
          code="500"
          kicker="Reel 500 · House lights out"
          title="The whole theatre went dark."
          note={error.digest ? `Reel ref · ${error.digest}` : undefined}
          actions={
            <>
              <ScreenAction onClick={retry} primary>
                Rewind and try again
              </ScreenAction>
              <ScreenAction href="/" hardNav>
                Back to the lobby
              </ScreenAction>
            </>
          }
        >
          Stay in your seat, we&apos;re bringing the lights back up.
        </ErrorScreen>
      </body>
    </html>
  );
}
