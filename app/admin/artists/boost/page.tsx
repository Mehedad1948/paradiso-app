import type { Metadata } from "next";
import CandidatesManager from "@/features/admin/CandidatesManager";

export const metadata: Metadata = { title: "Boost and block" };

export default function Page() {
  return <CandidatesManager />;
}
