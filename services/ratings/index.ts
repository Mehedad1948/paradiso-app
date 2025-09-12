import { UserType } from "@/types";
import { WebServices } from "..";
import { MovieWithRatings, VoteType } from "@/types/ratings";
import { PaginatedResponse } from "@/types/request";

class RatingServices {
  private webService = new WebServices("/ratings");

  getAllRatings() {
    return this.webService.get<{
      movies: PaginatedResponse<MovieWithRatings>;
      users: UserType[];
    }>("");
  }

  getRatingById(id: string) {
    return this.webService.get(`/${id}`);
  }

  castVote(roomId: string, data: VoteType) {
    return this.webService.post(`/${roomId}`, { body: data });
  }

  updateRating(id: string, data: any) {
    return this.webService.put(`/${id}`, data);
  }

  deleteRating(id: string) {
    return this.webService.delete(`/${id}`);
  }
}

const ratingServices = new RatingServices();

export default ratingServices;
