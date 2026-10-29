import type { components } from "./generated/backend";

/** The hand-curated landing lists. */
export type CurationKey = "landing-grid" | "editors-picks";

export type CuratedMovie = components["schemas"]["CuratedMovie"];
export type LandingGridItem = components["schemas"]["LandingGridItem"];
export type LandingGridItemInput = components["schemas"]["LandingGridItemRequest"];
export type AdminLandingGrid = components["schemas"]["AdminLandingGridResponse"];
export type AdminEditorsPicks = components["schemas"]["AdminEditorsPicksResponse"];

/** The editors' picks pool holds at most this many films; the shelf shows `DAILY_PICKS` a day. */
export const EDITORS_PICKS_MAX = 40;
export const DAILY_PICKS = 10;
/** Longest title search the admin picker sends. */
export const LIBRARY_SEARCH_MAX = 100;
