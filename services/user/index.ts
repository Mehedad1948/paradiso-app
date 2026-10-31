import type { RegisterInputs } from "@/types/auth";
import type { UpdateUserDto } from "@/types/user";
import { backendRequest } from "../backend";

const usersServices = {
  getMe: (signal?: AbortSignal) =>
    backendRequest("/users/me", "get", { signal }),
  updateMe: (body: UpdateUserDto) =>
    backendRequest("/users/me", "patch", { body }),
  genres: (signal?: AbortSignal) =>
    backendRequest("/genres", "get", { signal }),
  register: (body: RegisterInputs, clientIp?: string) =>
    backendRequest("/users", "post", { body, withAuth: false, clientIp }),
};

export default usersServices;
