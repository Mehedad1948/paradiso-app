import { ReactNode, Suspense } from "react";
import { Spinner } from "@heroui/spinner";

export default function layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl pt-24">
      <Suspense fallback={<Spinner className="p-8" />}>{children}</Suspense>
    </div>
  );
}
