import { WebServices } from "..";

export class MoviesServices {
  private webService = new WebServices();

  searchDbMovies({ query, signal }: { query: string; signal?: AbortSignal }) {
    return this.webService.get<{ results: import("@/types/movies").DbMovie[] }>(
      "/movies/tmdb/search",
      { params: { query }, signal },
    );
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
