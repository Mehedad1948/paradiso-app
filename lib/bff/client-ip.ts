import { isIP } from "node:net";

/**
 * The visitor's IP, for backend rate limits keyed per client.
 * Only Vercel is trusted: it overwrites x-forwarded-for, so the first entry is the real client.
 * Anywhere else the header is client-controlled, so we send nothing instead of a spoofable value.
 */
export function visitorIp(request: Request): string | undefined {
  if (process.env.VERCEL !== "1") return;
  const candidate =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  return candidate && isIP(candidate) ? candidate : undefined;
}
