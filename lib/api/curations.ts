import { bffRequest, queryString } from "./client";
import type {
  AdminEditorsPicks,
  AdminLandingGrid,
  CuratedMovie,
  EditorsPickItemInput,
  LandingGridItemInput,
  MoviePosters,
} from "@/types/curations";

const json = (body: unknown) => JSON.stringify(body);

/** The admin's edits to the landing's curated lists. */
export const curationsApi = {
  landingGrid: (signal?: AbortSignal) =>
    bffRequest<AdminLandingGrid>("/admin/curations/landing-grid", { signal }),
  saveLandingGrid: (items: LandingGridItemInput[]) =>
    bffRequest<AdminLandingGrid>("/admin/curations/landing-grid", { method: "PUT", body: json({ items }) }),
  editorsPicks: (signal?: AbortSignal) =>
    bffRequest<AdminEditorsPicks>("/admin/curations/editors-picks", { signal }),
  saveEditorsPicks: (items: EditorsPickItemInput[]) =>
    bffRequest<AdminEditorsPicks>("/admin/curations/editors-picks", { method: "PUT", body: json({ items }) }),
  moviePosters: (movieId: string, signal?: AbortSignal) =>
    bffRequest<MoviePosters>(`/admin/curations/movies/${movieId}/posters`, { signal }),
  searchLibrary: (search: string, signal?: AbortSignal) =>
    bffRequest<CuratedMovie[]>(`/admin/library${queryString({ search })}`, { signal }),
};
