import "@/styles/globals.css";
import { Metadata } from "next";
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
  icons: {
    icon: "/favicon.ico",
  },
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
