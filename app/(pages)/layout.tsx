import Header from "@/components/ui/Header";
import OnboardingGate from "@/components/auth/OnboardingGate";
import { ReactNode, Suspense } from "react";

/** `movie` overlays a film's details on whichever page opened it, the landing included. */
export default function layout({ children, movie }: { children: ReactNode; movie: ReactNode }) {
  return (
    <div className="h-full">
      <Suspense fallback={null}>
        <Header />
        <OnboardingGate />
      </Suspense>
      {children}
      <Suspense>{movie}</Suspense>
    </div>
  );
}
