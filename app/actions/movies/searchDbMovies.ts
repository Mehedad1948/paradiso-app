"use server";

import { MoviesServices } from "@/services/movies";
import { formatResponse } from "@/utils/formatResponse";

export async function searchDbMovies(query: string) {
  const res = await new MoviesServices().searchDbMovies({ query });

  return formatResponse(res);
}
