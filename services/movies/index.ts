import { PaginatedResponse, UserType } from "@/types";
import { WebServices } from "..";
import { MovieWithRatings } from "@/types/ratings";

export class MoviesServices {
  private webService = new WebServices();

  searchDbMovies({ query }: { query: string }) {

    return this.webService.get<any>(`/movies/tmdb/search?query=${query}`);
  }

  addMovie({ query }: { query: string }) {

    return this.webService.post<any>(`/movies`, { body: {} });
  }

  getRatingById(id: string) {
    return this.webService.get(`/ratings/${id}`);
  }

  createRating(data: any) {
    return this.webService.post("/ratings", data);
  }

  updateRating(id: string, data: any) {
    return this.webService.put(`/ratings/${id}`, data);
  }

  deleteRating(id: string) {
    return this.webService.delete(`/ratings/${id}`);
  }
}
