import { User } from "@/types/user";
import { WebServices } from "..";
import { RegisterInputs } from "../auth/types";

class UsersServices {
  private webService = new WebServices("/users");

  async getMe(signal?: AbortSignal) {
    const res = await this.webService.get<User>(`/me`, { signal });
    return res;
  }

  async register(body: RegisterInputs) {
    const res = await this.webService.post(``, {
      body,
      withAuth: false,
    });
    return res;
  }
}

const usersServices = new UsersServices();

export default usersServices;
