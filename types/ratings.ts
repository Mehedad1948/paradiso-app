export type MovieWithRatings = import("./generated/backend").components["schemas"]["RatedMovie"];

export type VoteType = import("./backend").BackendRequestBody<"/ratings/{id}", "post">;
