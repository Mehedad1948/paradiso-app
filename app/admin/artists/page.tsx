import type { Metadata } from "next";
import ArtistSchedule from "@/features/admin/ArtistSchedule";

export const metadata: Metadata = { title: "Featured artist" };

export default function Page() {
  return <ArtistSchedule />;
}
