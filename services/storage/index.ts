import { backendRequest } from "../backend";

const storageServices = {
  uploadImage(file: File, folder: string) {
    const body = new FormData();
    body.set("file", file);
    body.set("folder", folder);
    return backendRequest("/uploads/file", "post", { body });
  },
};

export default storageServices;
