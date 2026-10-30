import "server-only";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import rooms from "@/services/rooms";
import { publicRooms, publicRoomsTag } from "@/services/rooms/public";
import links from "@/services/rooms/room-invite-link.service";
import roomInvitations from "@/services/rooms/room-invitation.service";
import users from "@/services/user";
import auth from "@/services/auth/authServices";
import { passwordInput, usernameInput } from "@/lib/auth/validation";
import ratings from "@/services/ratings";
import storage from "@/services/storage";
import watchlist from "@/services/watchlist";
import favorites from "@/services/favorites";
import { moviesServices } from "@/services/movies";
import { movieDetails } from "@/services/movies/details";
import { movieComments } from "@/services/movies/comments";
import { personDetails } from "@/services/people/details";
import { commentTextError } from "@/lib/community/validation";
import { handleChatRequest } from "./chat";
import { handleAdminRequest } from "./curations";
import { handleCommunityRequest } from "./community";
import { handleNotificationsRequest } from "./notifications";
import { handleInvitationsRequest, handleRoomInvitationsRequest } from "./invitations";
import type { RequestResult } from "@/types/request";
import { MAX_FAVORITE_MOVIES, MAX_FAVORITE_NOTE_LENGTH } from "@/types/community";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  MAX_FAVORITE_GENRES,
  type UpdateMeInputs,
} from "@/types/user";
import { ROOM_INVITE_POLICIES, type RoomInvitePolicy } from "@/types/invitations";
import {
  customMovieErrorsFrom,
  parseCustomMovie,
} from "@/lib/movies/custom-movie";
import {
  InputError,
  positiveInteger,
  text,
  identifier,
  boolean,
  date,
  assertSameOrigin,
} from "./validation";

function imageUrl<Room extends { image?: string | null }>(room: Room) {
  return {
    ...room,
    imageUrl: room.image
      ? `${process.env.AWS_BASE_URL || ""}${room.image}`
      : null,
  };
}

/** Film details are public and barely change, so browsers and CDNs may keep them. */
const PUBLIC_CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/** The public room list changes with every join, so it is kept briefly (the backend's own policy). */
const PUBLIC_ROOMS_CACHE = "public, max-age=30, s-maxage=60, stale-while-revalidate=300";

function respond<T>(result: RequestResult<T>, cache?: "public" | "rooms") {
  const status = result.response.ok
    ? 200
    : result.response.status >= 400
      ? result.response.status
      : 502;
  // Do not expose network diagnostics or backend infrastructure details.
  const payload =
    status >= 500
      ? {
          result: null,
          response: {
            ok: false,
            status,
            statusText: "",
            message: "Backend unavailable. Please try again.",
          },
        }
      : result;
  return NextResponse.json(payload, {
    status,
    headers:
      cache && status === 200
        ? { "Cache-Control": cache === "rooms" ? PUBLIC_ROOMS_CACHE : PUBLIC_CACHE }
        : { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}

/** A change to a room, its members or who may join drops the shared public list on its next read. */
function roomsChanged<T>(result: RequestResult<T>) {
  if (result.response.ok) revalidateTag(publicRoomsTag, { expire: 0 });
  return result;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Profile fields only; omitted fields stay unchanged on the backend. */
function parseUpdateMe(data: Record<string, unknown>): UpdateMeInputs {
  const unknown = Object.keys(data).find(
    (key) => !["avatar", "genreIds", "onboarded", "username", "roomInvitePolicy"].includes(key),
  );
  if (unknown) throw new InputError(`Unexpected field ${unknown}`);
  const update: UpdateMeInputs = {};
  if (data.username !== undefined) update.username = usernameInput(data.username);
  if (data.avatar !== undefined) {
    if (data.avatar === null) update.avatar = null;
    else {
      const avatar = text(data.avatar, "avatar", 255);
      if (!/^https:\/\/[^\s]+$/.test(avatar)) throw new InputError("Invalid avatar");
      update.avatar = avatar;
    }
  }
  if (data.genreIds !== undefined) {
    const ids = data.genreIds;
    if (
      !Array.isArray(ids) ||
      ids.length > MAX_FAVORITE_GENRES ||
      ids.some((id) => typeof id !== "string" || !uuid.test(id)) ||
      new Set(ids).size !== ids.length
    )
      throw new InputError(`Choose up to ${MAX_FAVORITE_GENRES} different genres`);
    update.genreIds = ids as string[];
  }
  if (data.onboarded !== undefined) {
    if (data.onboarded !== true) throw new InputError("Invalid onboarded");
    update.onboarded = true;
  }
  if (data.roomInvitePolicy !== undefined) {
    if (!ROOM_INVITE_POLICIES.includes(data.roomInvitePolicy as RoomInvitePolicy))
      throw new InputError("Invalid roomInvitePolicy");
    update.roomInvitePolicy = data.roomInvitePolicy as RoomInvitePolicy;
  }
  if (!Object.keys(update).length) throw new InputError("Nothing to update");
  return update;
}

/**
 * A movie comment's text and spoiler flag. Edits send both too: the backend defaults a missing
 * flag to false, which would quietly unmark a spoiler.
 */
function movieCommentInput(data: Record<string, unknown>) {
  if (typeof data.text !== "string") throw new InputError("Invalid text");
  const error = commentTextError(data.text);
  if (error) throw new InputError(error);
  if (data.spoiler !== undefined && typeof data.spoiler !== "boolean") throw new InputError("Invalid spoiler");
  return { text: data.text.trim(), spoiler: data.spoiler === true };
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new InputError("Expected a JSON object");
    return value as Record<string, unknown>;
  } catch {
    throw new InputError("Invalid JSON body");
  }
}

/** Explicit resource allowlist; never forward arbitrary paths to the backend. */
export async function handlePanelRequest(request: Request, path: string[]) {
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const signedIn = !!(await cookies()).get("token")?.value;
    const query = new URL(request.url).searchParams;
    const method = request.method;
    // The community is readable signed out; its handler guards the write routes.
    if (path[0] === "community")
      return respond(
        await handleCommunityRequest({
          path: path.slice(1),
          method,
          query,
          data: () => body(request),
          signal: request.signal,
          signedIn,
        }),
      );
    // A member's favorites are part of their public profile.
    if (path.length === 3 && path[0] === "favorites" && path[1] === "users" && method === "GET")
      return respond(
        await favorites.listForUser(positiveInteger(path[2], "userId"), request.signal),
      );
    // Anyone may look a film up, signed in or not.
    if (path.length === 3 && path[0] === "movies" && path[2] === "details" && method === "GET") {
      if (!uuid.test(path[1])) throw new InputError("Invalid movie", 404);
      return respond(await movieDetails(path[1]), "public");
    }
    // A director's or actor's page is public, like a film's.
    if (path.length === 2 && path[0] === "people" && method === "GET")
      return respond(await personDetails(positiveInteger(path[1], "person")), "public");
    // Anyone may read what people said about a film; writing needs an account.
    if (path[0] === "movies" && path[2] === "comments" && (path.length === 3 || path.length === 4)) {
      if (!uuid.test(path[1])) throw new InputError("Invalid movie", 404);
      const movieId = path[1];
      if (path.length === 3 && method === "GET")
        return respond(
          await movieComments.list(
            movieId,
            {
              limit: positiveInteger(query.get("limit"), "limit", 20, 50),
              before: query.has("before") ? positiveInteger(query.get("before"), "before") : undefined,
            },
            request.signal,
          ),
        );
      if (!signedIn) throw new InputError("Sign in to continue", 401);
      if (path.length === 3 && method === "POST") {
        const data = await body(request);
        return respond(await movieComments.create(movieId, movieCommentInput(data)));
      }
      if (path.length === 4) {
        const commentId = positiveInteger(path[3], "commentId");
        if (method === "PATCH")
          return respond(await movieComments.update(movieId, commentId, movieCommentInput(await body(request))));
        if (method === "DELETE") return respond(await movieComments.remove(movieId, commentId));
      }
    }
    const page = () => positiveInteger(query.get("page"), "page", 1);
    const limit = () => positiveInteger(query.get("limit"), "limit", 10, 100);
    // Public rooms can be browsed signed out, and are the same for everyone, so they are cacheable.
    if (path.length === 2 && path[0] === "rooms" && path[1] === "public" && method === "GET") {
      const result = await publicRooms(page(), limit(), request.signal);
      return respond(
        {
          ...result,
          result: result.result
            ? { ...result.result, data: result.result.data.map(imageUrl) }
            : null,
        },
        "rooms",
      );
    }
    if (!signedIn) throw new InputError("Sign in to continue", 401);
    const resource = path.join("/");
    if (path[0] === "admin")
      return respond(
        await handleAdminRequest({
          path: path.slice(1),
          method,
          query,
          data: () => body(request),
          signal: request.signal,
        }),
      );
    if (path[0] === "notifications")
      return respond(
        await handleNotificationsRequest({
          path: path.slice(1),
          method,
          query,
          data: () => body(request),
          signal: request.signal,
        }),
      );

    const invitation = await handleInvitationsRequest({
      path,
      method,
      query,
      data: () => body(request),
      signal: request.signal,
    });
    if (invitation) {
      // Accepting an invitation or approving a join request adds a member.
      const action = path[0] === "room-invitations" ? path[2] : undefined;
      return respond(action === "accept" || action === "approve" ? roomsChanged(invitation) : invitation);
    }

    if (resource === "me" && method === "GET")
      return respond(await users.getMe(request.signal));
    if (resource === "me" && method === "PATCH")
      return respond(await users.updateMe(parseUpdateMe(await body(request))));
    if (resource === "me/password" && method === "POST") {
      const data = await body(request);
      const currentPassword = passwordInput(data.currentPassword);
      const newPassword = passwordInput(data.newPassword, true);
      if (newPassword === currentPassword)
        throw new InputError("Choose a password different from your current one.");
      const me = await users.getMe(request.signal);
      if (!me.response.ok || !me.result) return respond(me);
      // The backend does not ask for the old password, so prove it here with a sign-in.
      const check = await auth.signIn({ email: me.result.email, password: currentPassword });
      if (check.response.status === 400 || check.response.status === 401)
        throw new InputError("Your current password is incorrect.");
      if (!check.response.ok) return respond(check);
      const result = await users.updateMe({ password: newPassword });
      return respond({ ...result, result: result.result ? { ok: true } : null });
    }
    if (resource === "genres" && method === "GET")
      return respond(await users.genres(request.signal));
    if (path[0] === "watchlist" && path.length <= 2) {
      if (path.length === 1 && method === "GET")
        return respond(
          await watchlist.list({ page: page(), limit: limit() }, request.signal),
        );
      if (path.length === 2) {
        const movieId = identifier(path[1]);
        if (method === "GET") return respond(await watchlist.has(movieId, request.signal));
        if (method === "PUT") return respond(await watchlist.add(movieId));
        if (method === "DELETE") return respond(await watchlist.remove(movieId));
      }
    }
    if (resource === "favorites") {
      if (method === "GET") return respond(await favorites.list(request.signal));
      if (method === "PUT") {
        const ids = (await body(request)).movieIds;
        if (
          !Array.isArray(ids) ||
          ids.length > MAX_FAVORITE_MOVIES ||
          ids.some((id) => typeof id !== "string" || !uuid.test(id)) ||
          new Set(ids).size !== ids.length
        )
          throw new InputError(`Choose up to ${MAX_FAVORITE_MOVIES} different films`);
        return respond(await favorites.set(ids as string[]));
      }
    }
    if (path.length === 2 && path[0] === "favorites") {
      const movieId = identifier(path[1]);
      if (method === "GET") return respond(await favorites.has(movieId, request.signal));
      if (method === "PUT") return respond(await favorites.add(movieId));
      if (method === "DELETE") return respond(await favorites.remove(movieId));
      if (method === "PATCH") {
        const note = (await body(request)).note;
        if (note !== null && typeof note !== "string") throw new InputError("Invalid note");
        const trimmed = note?.trim() || null;
        if (trimmed && trimmed.length > MAX_FAVORITE_NOTE_LENGTH)
          throw new InputError(`Keep your note under ${MAX_FAVORITE_NOTE_LENGTH} characters`);
        return respond(await favorites.setNote(movieId, trimmed));
      }
    }
    // Opening a filmography film that isn't in the library adds it, recorded as this member's.
    if (resource === "movies/resolve" && method === "POST")
      return respond(await moviesServices.resolve(positiveInteger((await body(request)).tmdbId, "tmdbId")));
    if (resource === "movies/search" && method === "GET") {
      return respond(
        await moviesServices.searchDbMovies(
          text(query.get("query"), "query", 200),
          request.signal,
        ),
      );
    }
    if (
      path.length === 3 &&
      path[0] === "invite-links" &&
      path[1] === "verify" &&
      method === "POST"
    )
      return respond(await links.verify(text(path[2], "token", 512)));
    if (resource === "room-invitations/accept" && method === "POST") {
      const data = await body(request);
      return respond(
        roomsChanged(await roomInvitations.accept(text(data.token, "token", 2048))),
      );
    }
    if (resource === "uploads" && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      const folder = form.get("folder");
      if (folder !== "rooms" && folder !== "community" && folder !== "avatars")
        throw new InputError("Invalid upload folder");
      if (folder === "avatars") {
        if (!(file instanceof File) || file.size === 0 || !AVATAR_TYPES.includes(file.type))
          throw new InputError("Choose a JPEG, PNG or WebP image", 415);
        if (file.size > AVATAR_MAX_BYTES)
          throw new InputError("Choose an image up to 2 MB", 413);
      } else if (
        !(file instanceof File) ||
        !file.type.startsWith("image/") ||
        file.size === 0 ||
        file.size > 5 * 1024 * 1024
      ) {
        throw new InputError("Choose an image up to 5 MB");
      }
      const result = await storage.uploadImage(file, folder);
      if (folder === "rooms" || !result.result) return respond(result);
      // Community posts store an absolute HTTPS URL rather than a storage key.
      const { path: stored, name } = result.result;
      const url = /^https:\/\//.test(stored)
        ? stored
        : `${process.env.AWS_BASE_URL || ""}${name}`;
      if (!url.startsWith("https://"))
        throw new InputError("Uploaded image has no public HTTPS address", 502);
      return respond({ ...result, result: { ...result.result, url } });
    }
    // The caller's own rooms carry per-user data (unread counts), so they are never cached.
    if (resource === "rooms/mine" && method === "GET") {
      const result = await rooms.getMyRooms({
        page: page(),
        limit: limit(),
        signal: request.signal,
      });
      return respond({
        ...result,
        result: result.result
          ? { ...result.result, data: result.result.data.map(imageUrl) }
          : null,
      });
    }
    if (resource === "rooms") {
      if (method === "POST") {
        const data = await body(request);
        const result = roomsChanged(await rooms.createRoom({
          name: text(data.name, "name", 100),
          description:
            data.description === undefined || data.description === ""
              ? undefined
              : text(data.description, "description", 2000),
          image: data.image == null ? null : text(data.image, "image", 1000),
          isPublic: boolean(data.isPublic, "isPublic", true),
        }));
        return respond({
          ...result,
          result: result.result ? imageUrl(result.result) : null,
        });
      }
    }
    if (path[0] !== "rooms" || !path[1])
      throw new InputError("Resource not found", 404);
    const roomId = positiveInteger(path[1], "roomId");
    if (path[2] === "chat" && path.length > 3)
      return respond(
        await handleChatRequest({
          roomId,
          path: path.slice(3),
          method,
          query,
          data: () => body(request),
          signal: request.signal,
        }),
      );
    if (path.length === 2 && method === "GET") {
      const result = await rooms.getRoomById(roomId, request.signal);
      return respond({
        ...result,
        result: result.result ? imageUrl(result.result) : null,
      });
    }
    if (path.length === 2 && method === "PATCH") {
      const data = await body(request);
      // Partial update: omitted fields are left untouched, null clears a nullable field.
      const nullable = <T>(value: unknown, parse: (value: unknown) => T) =>
        value === undefined ? undefined : value === null || value === "" ? null : parse(value);
      const themeColor = nullable(data.themeColor, (value) => {
        const color = text(value, "themeColor", 7);
        if (!/^#[0-9a-fA-F]{6}$/.test(color))
          throw new InputError("Theme color must be a #RRGGBB hex code");
        return color;
      });
      const result = roomsChanged(await rooms.updateRoom(roomId, {
        name: data.name === undefined ? undefined : text(data.name, "name", 255),
        description: nullable(data.description, (value) =>
          text(value, "description", 2000),
        ),
        image: nullable(data.image, (value) => text(value, "image", 1000)),
        isPublic: boolean(data.isPublic, "isPublic"),
        themeColor,
      }));
      return respond({
        ...result,
        result: result.result ? imageUrl(result.result) : null,
      });
    }
    if (path.length === 3) {
      switch (path[2]) {
        case "join":
          if (method === "POST") {
            const me = await users.getMe(request.signal);
            if (!me.response.ok || !me.result) return respond(me);
            // Membership identity is derived from the session, never from client input.
            return respond(
              roomsChanged(await rooms.joinRoom({ roomId, userId: me.result.id })),
            );
          }
          break;
        case "leave":
          if (method === "POST") {
            const data = await body(request);
            return respond(
              roomsChanged(await rooms.leaveRoom(roomId, {
                clearVotes: boolean(data.clearVotes, "clearVotes", false) ?? false,
              })),
            );
          }
          break;
        case "bans":
          if (method === "POST") {
            const data = await body(request);
            return respond(
              roomsChanged(await rooms.banUser(roomId, {
                userId: positiveInteger(data.userId, "userId"),
                ...(data.reason ? { reason: text(data.reason, "reason", 500) } : {}),
              })),
            );
          }
          break;
        case "ratings":
          if (method === "GET") {
            const sortBy = query.get("sortBy");
            const sortOrder = query.get("sortOrder");
            if (
              sortBy &&
              sortBy !== "rate" &&
              sortBy !== "userRate" &&
              sortBy !== "controversy"
            )
              throw new InputError("Invalid sortBy");
            if (sortOrder && sortOrder !== "asc" && sortOrder !== "desc")
              throw new InputError("Invalid sortOrder");
            const startDate = date(query.get("startDate"), "startDate");
            const endDate = date(query.get("endDate"), "endDate");
            if (startDate && endDate && startDate > endDate)
              throw new InputError("Invalid date range");
            return respond(
              await rooms.getRoomRatings(
                roomId,
                {
                  page: page(),
                  limit: limit(),
                  search: query.get("search")
                    ? text(query.get("search"), "search", 200)
                    : undefined,
                  sortBy:
                    sortBy === "rate" ||
                    sortBy === "userRate" ||
                    sortBy === "controversy"
                      ? sortBy
                      : undefined,
                  sortOrder:
                    sortOrder === "asc" || sortOrder === "desc"
                      ? sortOrder
                      : undefined,
                  sortByUserId: query.has("sortByUserId")
                    ? String(
                        positiveInteger(
                          query.get("sortByUserId"),
                          "sortByUserId",
                        ),
                      )
                    : undefined,
                  startDate,
                  endDate,
                  isWatchTogether: boolean(
                    query.get("isWatchTogether"),
                    "isWatchTogether",
                  ),
                  hasVoted: boolean(query.get("hasVoted"), "hasVoted"),
                },
                request.signal,
              ),
            );
          }
          if (method === "POST") {
            const data = await body(request);
            if (
              typeof data.rate !== "number" ||
              !Number.isFinite(data.rate) ||
              data.rate < 0 ||
              data.rate > 10
            )
              throw new InputError("Rate must be between 0 and 10");
            return respond(
              await ratings.castVote(roomId, {
                movieId: identifier(data.movieId),
                rate: data.rate,
              }),
            );
          }
          break;
        case "movies":
          if (method === "POST") {
            const data = await body(request);
            return respond(
              await rooms.addMovieToRoom(roomId, {
                dbId: positiveInteger(data.dbId, "dbId"),
                ...(data.isWatchedTogether === true
                  ? { isWatchedTogether: true }
                  : {}),
              }),
            );
          }
          break;
        case "custom-movies":
          if (method === "POST") {
            const parsed = parseCustomMovie(await body(request));
            if (parsed.errors)
              throw new InputError(
                Object.values(parsed.errors)[0]!,
                400,
                parsed.errors,
              );
            const result = await rooms.addCustomMovieToRoom(roomId, parsed.body);
            const fieldErrors =
              result.response.status === 400 && result.response.messages
                ? customMovieErrorsFrom(result.response.messages)
                : undefined;
            return respond(
              fieldErrors
                ? { ...result, response: { ...result.response, fieldErrors } }
                : result,
            );
          }
          break;
        case "invitations": {
          const result = await handleRoomInvitationsRequest(roomId, {
            method,
            query,
            data: () => body(request),
            signal: request.signal,
          });
          if (result) return respond(result);
          break;
        }
        case "invite-links":
          if (method === "GET")
            return respond(
              await links.getAll(
                roomId,
                page(),
                limit(),
                request.signal,
              ),
            );
          if (method === "POST") return respond(await links.create(roomId));
          break;
      }
    }
    if (
      path.length === 4 &&
      path[2] === "ratings" &&
      path[3] === "summary" &&
      method === "GET"
    )
      return respond(
        await rooms.getRoomRatingSummary(roomId, request.signal),
      );
    if (path.length === 4 && path[2] === "members" && method === "DELETE")
      return respond(
        roomsChanged(await rooms.kickUser(roomId, positiveInteger(path[3], "userId"))),
      );
    if (path.length === 4) {
      const id = identifier(path[3]);
      if (path[2] === "movies" && method === "PATCH") {
        const data = await body(request);
        const patch: Record<string, unknown> = {};
        if (data.title !== undefined) patch.title = text(data.title, "title", 255);
        if (data.release_date !== undefined)
          patch.release_date = text(data.release_date, "release_date", 10);
        if (data.isWatchedTogether !== undefined)
          patch.isWatchedTogether = boolean(data.isWatchedTogether, "isWatchedTogether");
        return respond(await moviesServices.update(id, patch));
      }
      if (path[2] === "movies" && method === "DELETE")
        return respond(
          await rooms.deleteMovie(roomId, { movieId: id }),
        );
      if (path[2] === "invite-links") {
        if (method === "DELETE")
          return respond(await links.delete(roomId, positiveInteger(id, "id")));
        if (method === "PATCH") {
          const data = await body(request);
          return respond(
            await links.update(roomId, positiveInteger(id, "id"), {
              isActive: boolean(data.isActive, "isActive"),
              maxUsage:
                data.maxUsage === null
                  ? null
                  : data.maxUsage === undefined
                    ? undefined
                    : positiveInteger(data.maxUsage, "maxUsage"),
              expiresAt: data.expiresAt === null
                ? null
                : date(data.expiresAt, "expiresAt")?.toISOString(),
            }),
          );
        }
      }
    }
    throw new InputError("Resource or method not found", 404);
  } catch (error) {
    const status = error instanceof InputError ? error.status : 500;
    return respond({
      result: null,
      response: {
        ok: false,
        status,
        statusText: "",
        message:
          error instanceof InputError
            ? error.message
            : "Unexpected server error",
        ...(error instanceof InputError && error.fieldErrors
          ? { fieldErrors: error.fieldErrors }
          : {}),
      },
    });
  }
}
