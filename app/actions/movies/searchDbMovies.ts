"use server";

import { MoviesServices } from "@/services/movies";
;

export async function searchDbMovies(query: string) {
  const res = await new MoviesServices().searchDbMovies({ query });

  return res;
}
