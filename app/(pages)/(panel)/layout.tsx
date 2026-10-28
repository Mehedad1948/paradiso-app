import { ReactNode, Suspense } from "react";
import { Spinner } from "@heroui/spinner";

/** `movie` overlays a film's details on whichever page opened it. */
export default function layout({ children, movie }: { children: ReactNode; movie: ReactNode }) {
  return (
    <div className="mx-auto min-h-svh max-w-[1440px] px-[4.5vw] pb-16 pt-32 max-sm:px-[5vw] max-sm:pb-10 max-sm:pt-36">
      <Suspense fallback={<Spinner className="p-8" />}>{children}</Suspense>
      <Suspense>{movie}</Suspense>
    </div>
  );
}
