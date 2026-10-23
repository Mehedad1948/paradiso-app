import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata(
  "Cinephile profile",
  "A member of the Paradiso film community: their posts, taste and company.",
  { noIndex: true },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
