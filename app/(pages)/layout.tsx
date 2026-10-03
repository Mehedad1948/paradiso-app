import Header from "@/components/ui/Header";
import { ReactNode, Suspense } from "react";

export default function layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      {children}
    </div>
  );
}
