import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f1f3" },
    { media: "(prefers-color-scheme: dark)", color: "#171815" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "text-foreground bg-background min-h-screen h-fit font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers>
          <div className="relative   flex flex-col ">
            <main className=" min-h-fit w-full   flex-grow">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
