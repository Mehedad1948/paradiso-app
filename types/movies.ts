export type DbMovie = import("./generated/backend").components["schemas"]["TmdbSearchMovie"];
export type MovieDetails = import("./generated/backend").components["schemas"]["MovieDetailsResponse"];
export type MovieCastMember = MovieDetails["cast"][number];
export type MovieComment = import("./generated/backend").components["schemas"]["MovieComment"];
export type MovieCommentPage = import("./generated/backend").components["schemas"]["MovieCommentPageResponse"];
export type MovieCommentInput = { text: string; spoiler?: boolean };
