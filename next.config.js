/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  experimental: {
    // Keeps offline navigations and Server Actions pending and retries them on reconnect.
    useOffline: true,
  },
  async headers() {
    return [
      {
        // The worker must always be revalidated so updates reach users promptly.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; connect-src 'self' https://image.tmdb.org" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "heroui.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "nestjsblog.storage.iran.liara.space",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
};

module.exports = nextConfig;
