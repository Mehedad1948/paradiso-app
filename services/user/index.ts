import { User } from "@/types/user";
import { WebServices } from "..";
import { RegisterInputs } from '../auth/types';

class UsersServices {
  private webService = new WebServices("/users");

  async getMe() {
    const res = await this.webService.get<User>(`/me`);
    return res;
  }

  async register(body: RegisterInputs) {
    const res = await new WebServices().post(``, {
      body,
    });
    return res;
  }
}

const usersServices = new UsersServices();

export default usersServices;
