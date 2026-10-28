type Schemas = import("./generated/backend").components["schemas"];

/** A director, actor or crew member from TMDb, with their filmography. */
export type Person = Schemas["PersonResponse"];
export type PersonCredit = Schemas["CreditItem"];
export type ResolvedMovieId = Schemas["ResolvedMovieResponse"];
