import type { BackendRequestBody } from "@/types/backend";
import { backendRequest } from "../backend";

type CreateBody = BackendRequestBody<"/rooms/{roomId}/invite-links", "post">;
type UpdateBody = BackendRequestBody<"/rooms/{roomId}/invite-links/{id}", "patch">;

const roomInviteLinksService = {
  create(roomId: number, body: CreateBody = {}) {
    return backendRequest("/rooms/{roomId}/invite-links", "post", {
      pathParams: { roomId }, body,
    });
  },
  getAll(roomId: number, page = 1, limit = 10, signal?: AbortSignal) {
    return backendRequest("/rooms/{roomId}/invite-links", "get", {
      pathParams: { roomId }, query: { page, limit }, signal,
    });
  },
  update(roomId: number, id: number, body: UpdateBody) {
    return backendRequest("/rooms/{roomId}/invite-links/{id}", "patch", {
      pathParams: { roomId, id }, body,
    });
  },
  delete(roomId: number, id: number) {
    return backendRequest("/rooms/{roomId}/invite-links/{id}", "delete", {
      pathParams: { roomId, id },
    });
  },
  verify(token: string) {
    return backendRequest("/invite-links/verify/{token}", "post", {
      pathParams: { token },
    });
  },
  tokenInfo(token: string) {
    return backendRequest("/invite-links/{token}", "get", {
      pathParams: { token }, withAuth: false,
    });
  },
};

export default roomInviteLinksService;
