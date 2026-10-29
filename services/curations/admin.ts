import "server-only";
import type { LandingGridItemInput } from "@/types/curations";
import { backendRequest } from "../backend";

/** The admin's view of the landing lists. The backend checks the admin role on every call. */
const curationsAdminServices = {
  landingGrid(signal?: AbortSignal) {
    return backendRequest("/admin/curations/landing-grid", "get", { signal });
  },
  saveLandingGrid(items: LandingGridItemInput[]) {
    return backendRequest("/admin/curations/landing-grid", "put", { body: { items } });
  },
  editorsPicks(signal?: AbortSignal) {
    return backendRequest("/admin/curations/editors-picks", "get", { signal });
  },
  saveEditorsPicks(movieIds: string[]) {
    return backendRequest("/admin/curations/editors-picks", "put", { body: { movieIds } });
  },
  /** Library films whose title matches, newest first. */
  searchLibrary(search: string, page: number, signal?: AbortSignal) {
    return backendRequest("/movies", "get", { query: { search, page, limit: 20 }, withAuth: false, signal });
  },
};

export default curationsAdminServices;
