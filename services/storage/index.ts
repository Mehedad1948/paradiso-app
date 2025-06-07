import { CreateRoomInputs, Room } from "@/types/rooms";
import { WebServices } from "..";
import { PaginatedResponse } from "@/types";

export class StorageServices {
  private webService = new WebServices();

  uploadImage(file: File, folder: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return this.webService.post(`/uploads/file`, { body: formData });
  }
}
