import type { Metadata } from "next";
import LandingGridEditor from "@/features/admin/LandingGridEditor";

export const metadata: Metadata = { title: "Landing grid" };

export default function Page() {
  return <LandingGridEditor />;
}
