import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/config/seo";
import { imageSrc } from "@/features/community/format";
import { personIdFrom, roleLine } from "@/features/people/format";
import { personDetails } from "@/services/people/details";

const fallback = pageMetadata("Person", "A filmmaker on Paradiso.", { noIndex: true });

const clip = (value: string, max: number) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ personId: string }>;
}): Promise<Metadata> {
  const { personId } = await params;
  const id = personIdFrom(personId);
  if (!id) return fallback;
  // Shares the server's cached copy with the BFF, so this rarely reaches the backend.
  const { result: person } = await personDetails(id);
  if (!person) return fallback;

  const roles = roleLine(person);
  const description =
    clip(person.biography, 200) ||
    `${person.name}${roles.length ? `, ${roles.join(", ").toLowerCase()}` : ""}: the films, on Paradiso.`;
  const src = imageSrc(person.profile_path, "w780");
  return pageMetadata(person.name, description, {
    image: src ? { url: src, alt: person.name } : undefined,
  });
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
