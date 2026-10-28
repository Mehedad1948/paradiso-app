export type DbMovie = import("./generated/backend").components["schemas"]["TmdbSearchMovie"];
/**
 * `backdrops` (up to 8 stills, the main backdrop first) ships in the next backend release; until
 * the regenerated schema has it, it's optional here.
 */
export type MovieDetails = import("./generated/backend").components["schemas"]["MovieDetailsResponse"] & {
  backdrops?: string[];
};
export type MovieCastMember = MovieDetails["cast"][number];
export type MovieComment = import("./generated/backend").components["schemas"]["MovieComment"];
export type MovieCommentPage = import("./generated/backend").components["schemas"]["MovieCommentPageResponse"];
export type MovieCommentInput = { text: string; spoiler?: boolean };
