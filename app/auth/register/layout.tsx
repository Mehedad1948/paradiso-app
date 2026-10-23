import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata(
  "Join Paradiso",
  "Create your Paradiso account and start gathering your circle for an evening of cinema.",
  { noIndex: true },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
