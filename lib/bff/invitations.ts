import "server-only";
import invitations, { type InvitationAction } from "@/services/rooms/room-invitation.service";
import type { RequestResult } from "@/types/request";
import {
  INVITATION_STATUSES,
  INVITEE_STATUSES,
  type Invitation,
  type InvitationStatus,
} from "@/types/invitations";
import { InputError, positiveInteger, text } from "./validation";

type Incoming = {
  path: string[];
  method: string;
  query: URLSearchParams;
  data: () => Promise<Record<string, unknown>>;
  signal: AbortSignal;
};

const ACTIONS: InvitationAction[] = ["accept", "decline", "approve", "reject"];

/** Room images are storage keys; the client gets an absolute URL like everywhere else. */
const absolute = (image: string | null) =>
  !image || /^https?:\/\//.test(image) ? image : `${process.env.AWS_BASE_URL || ""}${image}`;

const withImage = <T extends { room: { image: string | null } }>(item: T): T => ({
  ...item,
  room: { ...item.room, image: absolute(item.room.image) },
});

function mapResult<T, R>(result: RequestResult<T>, map: (value: T) => R): RequestResult<R> {
  return { ...result, result: result.result ? map(result.result) : null } as RequestResult<R>;
}

const page = <T extends { data: Invitation[] }>(value: T): T => ({
  ...value,
  data: value.data.map(withImage),
});

function status<S extends InvitationStatus>(value: string | null, allowed: readonly S[]) {
  if (!value) return undefined;
  if (!allowed.includes(value as S)) throw new InputError("Invalid status");
  return value as S;
}

const paging = (query: URLSearchParams) => ({
  page: positiveInteger(query.get("page"), "page", 1),
  limit: positiveInteger(query.get("limit"), "limit", 10, 50),
});

/** `/rooms/:roomId/invitations`. */
export async function handleRoomInvitationsRequest(
  roomId: number,
  { method, query, data, signal }: Omit<Incoming, "path">,
): Promise<RequestResult<unknown> | null> {
  if (method === "GET")
    return mapResult(
      await invitations.forRoom(
        roomId,
        { ...paging(query), status: status(query.get("status"), INVITATION_STATUSES) },
        signal,
      ),
      page,
    );
  if (method === "POST") {
    const body = await data();
    const hasUser = body.userId !== undefined && body.userId !== null;
    const hasEmail = typeof body.email === "string" && body.email !== "";
    if (hasUser === hasEmail) throw new InputError("Send a user or an email address");
    let target: { userId: number } | { email: string };
    if (hasUser) target = { userId: positiveInteger(body.userId, "userId") };
    else {
      const email = text(body.email, "email", 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("Invalid email");
      target = { email };
    }
    return mapResult(await invitations.invite(roomId, target), withImage);
  }
  return null;
}

/**
 * `/me/room-invitations`, `/room-invitations/:id[/action]` and
 * `/users/:id/invitable-rooms`. Returns null when the path is not one of them.
 */
export async function handleInvitationsRequest({
  path,
  method,
  query,
  signal,
}: Incoming): Promise<RequestResult<unknown> | null> {
  const resource = path.join("/");
  if (resource === "me/room-invitations" && method === "GET")
    return mapResult(
      await invitations.mine(
        { ...paging(query), status: status(query.get("status"), INVITEE_STATUSES) },
        signal,
      ),
      page,
    );
  if (path[0] === "users" && path[2] === "invitable-rooms" && path.length === 3 && method === "GET")
    return mapResult(
      await invitations.invitableRooms(positiveInteger(path[1], "userId"), signal),
      (value) => ({ ...value, data: value.data.map((room) => ({ ...room, image: absolute(room.image) })) }),
    );
  if (path[0] === "room-invitations" && path[1] !== "accept" && path.length >= 2) {
    const id = positiveInteger(path[1], "invitationId");
    if (path.length === 2 && method === "DELETE")
      return mapResult(await invitations.cancel(id), withImage);
    const action = path[2] as InvitationAction;
    if (path.length === 3 && method === "POST" && ACTIONS.includes(action))
      return mapResult(await invitations.act(id, action), withImage);
  }
  return null;
}
