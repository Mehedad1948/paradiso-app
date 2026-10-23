import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

const icon = (size: number, purpose: "any" | "maskable" = "any") => ({
  src: purpose === "any" ? `/icons/icon-${size}.png` : `/icons/maskable-${size}.png`,
  sizes: `${size}x${size}`,
  type: "image/png",
  purpose,
});

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#f0f1f3",
    theme_color: "#f0f1f3",
    categories: ["entertainment", "social", "lifestyle"],
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      ...[48, 72, 96, 144, 192, 256, 384, 512].map((size) => icon(size)),
      icon(192, "maskable"),
      icon(512, "maskable"),
    ],
    shortcuts: [
      {
        name: "Rooms",
        short_name: "Rooms",
        description: "Jump back into your watch rooms",
        url: "/rooms",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Community",
        short_name: "Community",
        description: "See what everyone is watching",
        url: "/community",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
