import type { components } from "./generated/backend";
import type { BackendQuery, BackendRequestBody } from "./backend";

export type Room = components["schemas"]["RoomResponse"];
export type RoomListItem = components["schemas"]["RoomListItem"];

export type CreateRoomInputs = import("./backend").BackendRequestBody<"/rooms", "post">;

export type JoinRoomInputs = import("./backend").BackendRequestBody<"/rooms/join", "post">;

export type addMovieToRoomInputs = BackendRequestBody<"/rooms/add-movie/{id}", "post"> & {
  roomId: string | number;
};

type RoomRatingQuery = BackendQuery<"/rooms/{roomId}/rating", "get">;
export type RoomRatingFilters = Omit<RoomRatingQuery, "startDate" | "endDate" | "sortByUserId"> & {
  sortByUserId?: string;
  startDate?: Date;
  endDate?: Date;
};

