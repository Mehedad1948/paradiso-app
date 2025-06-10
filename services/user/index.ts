import { User } from "@/types/user";
import { WebServices } from "..";

export class UsersServices {
  private webService = new WebServices();

  async getMe() {
    const res = await this.webService.get<User>(`/users/me`);
    return res;
  }
}
