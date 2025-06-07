import { Room } from "@/types/rooms";
import { WebServices } from "..";
import { PaginatedResponse } from "@/types";

export class RoomsServices {
  private webService = new WebServices();

  getRooms({ page, limit }: { page: number; limit: number }) {
    return this.webService.get<PaginatedResponse<Room>>(`/rooms`, {
      params: {
        page,
        limit,
      },
    });
  }
}
