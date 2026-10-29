import type { Metadata } from "next";
import EditorsPicksEditor from "@/features/admin/EditorsPicksEditor";

export const metadata: Metadata = { title: "Editors’ picks" };

export default function Page() {
  return <EditorsPicksEditor />;
}
