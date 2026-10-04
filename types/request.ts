export type RequestResult<T> = {
  result: T | null;
  response: {
    ok: boolean;
    status: number;
    statusText: string;
    message?: string;
  };
  error?: string;
};

import type { components } from "./generated/backend";

export type PaginationMeta = components["schemas"]["PaginationMeta"];
export type PaginationLinks = components["schemas"]["PaginationLinks"];
export type PaginatedResponse<T> = Omit<components["schemas"]["RoomListResponse"], "data"> & {
  data: T[];
};
