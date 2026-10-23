import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata(
  "Welcome",
  "Tell us a little about yourself and take your seat at Paradiso.",
  { noIndex: true },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
