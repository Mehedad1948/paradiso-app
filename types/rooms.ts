import { MovieWithRatings, UserType } from ".";

export type Room = {
  id: number;
  name: string;
  image: string | null;
  isPublic: boolean;
  users: UserType[];
  movies: MovieWithRatings[];
  owner: UserType;
};

export type CreateRoomInputs = import("./backend").BackendRequestBody<"/rooms", "post">;

export type JoinRoomInputs = import("./backend").BackendRequestBody<"/rooms/join", "post">;

export type addMovieToRoomInputs = {
  roomId: string | number;
  dbId: number;
};

export type RoomRatingFilters = {
  search?: string;
  sortBy?: "rate" | "userRate";
  sortOrder?: "asc" | "desc";
  sortByUserId?: string;
  startDate?: Date;
  endDate?: Date;
  isWatchTogether?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
};

