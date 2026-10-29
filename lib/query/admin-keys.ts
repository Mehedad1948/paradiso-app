export const adminKeys = {
  featuredDays: (from: string, to: string) => ["admin", "featured", "days", from, to] as const,
  featuredDaysAll: ["admin", "featured", "days"] as const,
  candidates: (filter: string, page: number) => ["admin", "featured", "candidates", filter, page] as const,
  candidatesAll: ["admin", "featured", "candidates"] as const,
  people: (query: string, page: number) => ["admin", "featured", "people", query, page] as const,
  peopleAll: ["admin", "featured", "people"] as const,
  preview: (id: number) => ["admin", "featured", "preview", id] as const,
  tmdb: (query: string) => ["admin", "library", "tmdb", query] as const,
};
