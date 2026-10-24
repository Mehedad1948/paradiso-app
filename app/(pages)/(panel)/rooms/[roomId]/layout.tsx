import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import roomsServices from "@/services/rooms";

const fallbackDescription =
  "Your circle's private screening room on Paradiso: films, members and the night's verdict.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  const id = Number(roomId);
  const fallback = pageMetadata("Screening room", fallbackDescription, {
    noIndex: true,
  });
  if (!Number.isInteger(id) || id <= 0) return fallback;

  // Runs with the visitor's session cookie; no access (or an unreachable
  // backend) falls back to the generic title instead of leaking room details.
  const { result } = await roomsServices.getRoomById(id);
  if (!result) return fallback;

  const filmCount = result.movies.length;
  const memberCount = result.users.length;
  const stats = [
    `${memberCount} ${memberCount === 1 ? "member" : "members"}`,
    `${filmCount} ${filmCount === 1 ? "film" : "films"}`,
  ].join(", ");
  const description = result.description?.trim()
    ? `${result.description.trim()} (${stats})`
    : `${result.name} is a ${result.isPublic ? "public" : "private"} screening room on Paradiso with ${stats}. Rate films together and settle the night's verdict.`;

  return pageMetadata(result.name, description, {
    noIndex: true,
    image: result.image
      ? {
          url: `${process.env.AWS_BASE_URL || ""}${result.image}`,
          alt: `${result.name} cover image`,
        }
      : undefined,
  });
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
