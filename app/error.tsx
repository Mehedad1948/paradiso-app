"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mb-10 mt-[120px] max-w-[700px] px-6 py-10 [&_h1]:mb-5 [&_h1]:text-[clamp(32px,5vw,52px)] [&_h2]:mb-5 [&_h2]:text-[clamp(32px,5vw,52px)] [&_p]:mb-7 [&_p]:text-muted [&_a]:inline-flex [&_a]:items-center [&_a]:rounded-md [&_a]:bg-ink [&_a]:px-5 [&_a]:py-3 [&_a]:font-semibold [&_a]:text-canvas [&_button]:inline-flex [&_button]:items-center [&_button]:rounded-md [&_button]:bg-ink [&_button]:px-5 [&_button]:py-3 [&_button]:font-semibold [&_button]:text-canvas">
      <h2>Something went wrong!</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );
}
