import type { components } from "./generated/backend";

/** One day's pick. Only the first item carries `knownFor` and `libraryFilmCount`. */
export type FeaturedArtist = components["schemas"]["FeaturedArtistItem"];
export type FeaturedKnownFor = components["schemas"]["FeaturedKnownFor"];
