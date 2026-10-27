import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata(
  "Your watchlist",
  "Every film you've saved on Paradiso, waiting for the right night.",
  { noIndex: true },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
