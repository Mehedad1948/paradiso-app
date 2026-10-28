"use client";
import type { ComponentProps, SyntheticEvent } from "react";
import Link from "next/link";
import { usePrefetchPerson } from "@/hooks/queries/usePeopleQueries";
import { personHref } from "./format";

type LinkProps = Omit<ComponentProps<typeof Link>, "href">;

/** Opens a director's or actor's page; intent (hover, focus, touch) fetches it ahead of the click. */
export default function PersonLink({
  person,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: LinkProps & { person: { id: number; name: string } }) {
  const prefetch = usePrefetchPerson();
  const warm = <E extends SyntheticEvent<HTMLAnchorElement>>(handler?: (event: E) => void) => (event: E) => {
    prefetch(person.id);
    handler?.(event);
  };
  return (
    <Link
      {...props}
      href={personHref(person.id, person.name)}
      onMouseEnter={warm(onMouseEnter)}
      onFocus={warm(onFocus)}
      onTouchStart={warm(onTouchStart)}
    />
  );
}
