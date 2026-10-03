import { ReactNode, Suspense } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grid md:grid-cols-2 w-full h-full min-h-dvh">
      <div className="hidden md:block p-4 h-full w-full">
        <div className="rounded-3xl bg-purple-900 h-full w-full"></div>
      </div>
      <div className="px-6 md:px-16 py-8">
        <Suspense fallback={<p>Loading…</p>}>{children}</Suspense>
      </div>
    </div>
  );
}
