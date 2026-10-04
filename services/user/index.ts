import type { RegisterInputs } from "@/types/auth";
import { backendRequest } from "../backend";

const usersServices = {
  getMe: (signal?: AbortSignal) =>
    backendRequest("/users/me", "get", { signal }),
  register: (body: RegisterInputs) =>
    backendRequest("/users", "post", { body, withAuth: false }),
};

export default usersServices;
