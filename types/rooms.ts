import { UserType } from ".";
import { DbMovie } from "./movies";

export type Room = {
  id: number;
  name: string;
  image: string | null;
  isPublic: boolean;
  users: UserType[];
  movies: DbMovie[];
  owner: UserType;
};

export type CreateRoomInputs = {
  name: string;
  description?: string;
  image?: string | null;
  isPublic?: boolean;
};
