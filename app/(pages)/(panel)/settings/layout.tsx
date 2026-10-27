import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata(
  "Settings",
  "Your Paradiso account: profile, favorite genres, privacy and password.",
  { noIndex: true },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
