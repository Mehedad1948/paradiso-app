import { backendRequest } from "../backend";

const roomInvitationsService = {
  /** Accepts an email invitation (JWT token). Requires a signed-in session. */
  accept(token: string) {
    return backendRequest("/room-invitations/accept", "post", {
      body: { token },
    });
  },
};

export default roomInvitationsService;
