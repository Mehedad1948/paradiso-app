import { MovieWithRatings, UserType } from ".";
import { DbMovie } from "./movies";

export type Room = {
  id: number;
  name: string;
  image: string | null;
  isPublic: boolean;
  users: UserType[];
  movies: MovieWithRatings[];
  owner: UserType;
};

export type CreateRoomInputs = {
  name: string;
  description?: string;
  image?: string | null;
  isPublic?: boolean;
};

export type JoinRoomInputs = {
  userId: number;
  roomId: number;
};

export type addMovieToRoomInputs = {
  roomId: string | number;
  dbId: number;
};
