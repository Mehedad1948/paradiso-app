import Header from "@/components/ui/Header";
import OnboardingGate from "@/components/auth/OnboardingGate";
import { ReactNode, Suspense } from "react";

export default function layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full">
      <Suspense fallback={null}>
        <Header />
        <OnboardingGate />
      </Suspense>
      {children}
    </div>
  );
}
