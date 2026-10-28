export type DbMovie = import("./generated/backend").components["schemas"]["TmdbSearchMovie"];
export type MovieDetails = import("./generated/backend").components["schemas"]["MovieDetailsResponse"];
export type MovieCastMember = MovieDetails["cast"][number];
