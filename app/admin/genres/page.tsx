import type { Metadata } from "next";
import GenresManager from "@/features/admin/GenresManager";

export const metadata: Metadata = { title: "Genres" };

export default function Page() {
  return <GenresManager />;
}
