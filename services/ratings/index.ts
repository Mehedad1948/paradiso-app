import type { VoteType } from "@/types/ratings";
import { backendRequest } from "../backend";

const ratingServices = {
  getAllRatings: () => backendRequest("/ratings", "get"),
  getRatingById: (id: string) =>
    backendRequest("/ratings/movie/{id}", "get", { pathParams: { id } }),
  castVote: (roomId: number, body: VoteType) =>
    backendRequest("/ratings/{id}", "post", { pathParams: { id: roomId }, body }),
};

export default ratingServices;
