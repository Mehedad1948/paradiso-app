import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const seo = {
  tagline: "Circle of Cinema",
  title: "Paradiso | Circle of Cinema",
  description:
    "Make room for good cinema. A private screening room for you and your friends.",
  keywords: [
    "Paradiso",
    "movie night",
    "watch with friends",
    "film club",
    "movie rooms",
    "film community",
    "cinema",
  ],
  ogImage: {
    url: "/og.png",
    width: 1200,
    height: 585,
    alt: "Paradiso | Circle of Cinema",
  },
} as const;

/**
 * Social image for a page: the artwork with the "Cinema Paradiso" wordmark
 * composited bottom-left by `/api/og`. Pass `fit: "portrait"` for portraits.
 */
export function brandedOgImage(
  src: string | null | undefined,
  alt: string,
  options: { fit?: "portrait" } = {},
) {
  if (!src) return undefined;
  const params = new URLSearchParams({ src });
  if (options.fit) params.set("fit", options.fit);
  return {
    url: `/api/og?${params}`,
    width: seo.ogImage.width,
    height: 630,
    alt,
  };
}

/**
 * Metadata for an inner page. Next replaces `openGraph`/`twitter` wholesale
 * when a page defines them, so this re-attaches the shared OG image and keeps
 * every page's social card consistent. The tab title still flows through the
 * root `%s — Paradiso` template.
 */
export function pageMetadata(
  title: string,
  description: string,
  options: {
    noIndex?: boolean;
    image?: { url: string; alt?: string; width?: number; height?: number };
  } = {},
): Metadata {
  const socialTitle = `${title} | ${siteConfig.name}`;
  const image = options.image
    ? { ...options.image, alt: options.image.alt ?? title }
    : seo.ogImage;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: socialTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url],
    },
    ...(options.noIndex && { robots: { index: false, follow: false } }),
  };
}
