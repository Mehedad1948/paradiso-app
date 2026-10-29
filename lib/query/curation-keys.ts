export const curationKeys = {
  all: ["curations"] as const,
  landingGrid: ["curations", "landing-grid"] as const,
  editorsPicks: ["curations", "editors-picks"] as const,
  library: (search: string) => ["curations", "library", search] as const,
};
