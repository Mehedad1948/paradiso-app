/** The admin tools. The shell, the palette and the overview all read this list. */
export const ADMIN_TOOLS = [
  {
    href: "/admin/landing",
    label: "Landing grid",
    blurb: "The 27 film frames on the home page.",
    keywords: "home posters frames curation",
  },
  {
    href: "/admin/picks",
    label: "Editors’ picks",
    blurb: "The pool the daily shelf is drawn from.",
    keywords: "shelf curation films daily",
  },
  {
    href: "/admin/artists",
    label: "Featured artist",
    blurb: "Schedule the artist of the day.",
    keywords: "people schedule calendar director actor",
  },
  {
    href: "/admin/artists/boost",
    label: "Boost and block",
    blurb: "Tune the automatic artist draw.",
    keywords: "candidates people weight ban",
  },
  {
    href: "/admin/genres",
    label: "Genres",
    blurb: "Sync, rename and delete genres.",
    keywords: "tmdb categories",
  },
] as const;
