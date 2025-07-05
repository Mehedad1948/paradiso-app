import { PaginatedResponse, UserType } from "@/types";
import { WebServices } from "..";
import { MovieWithRatings, VoteType } from "@/types/ratings";

export class RatingServices {
  private webService = new WebServices();

  getAllRatings() {
    return this.webService.get<{
      movies: PaginatedResponse<MovieWithRatings>;
      users: UserType[];
    }>("/ratings");
  }

  getRatingById(id: string) {
    return this.webService.get(`/ratings/${id}`);
  }

  castVote(roomId: string, data: VoteType) {
    return this.webService.post(`/ratings/${roomId}`, { body: data });
  }

  updateRating(id: string, data: any) {
    return this.webService.put(`/ratings/${id}`, data);
  }

  deleteRating(id: string) {
    return this.webService.delete(`/ratings/${id}`);
  }
}
