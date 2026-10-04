import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import rooms from "@/services/rooms";
import links from "@/services/rooms/room-invite-link.service";
import users from "@/services/user";
import ratings from "@/services/ratings";
import storage from "@/services/storage";
import { moviesServices } from "@/services/movies";
import type { RequestResult } from "@/types/request";
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

function respond<T>(result: RequestResult<T>) {
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
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
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
    if (!(await cookies()).get("token")?.value)
      throw new InputError("Sign in to continue", 401);
    const query = new URL(request.url).searchParams;
    const method = request.method;
    const page = () => positiveInteger(query.get("page"), "page", 1);
    const limit = () => positiveInteger(query.get("limit"), "limit", 10, 100);
    const resource = path.join("/");

    if (resource === "me" && method === "GET")
      return respond(await users.getMe(request.signal));
    if (resource === "movies/search" && method === "GET") {
      return respond(
        await moviesServices.searchDbMovies(
          text(query.get("query"), "query", 200),
          request.signal,
        ),
      );
    }
    if (resource === "uploads" && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        !file.type.startsWith("image/") ||
        file.size === 0 ||
        file.size > 5 * 1024 * 1024
      ) {
        throw new InputError("Choose an image up to 5 MB");
      }
      if (form.get("folder") !== "rooms")
        throw new InputError("Invalid upload folder");
      return respond(await storage.uploadImage(file, "rooms"));
    }
    if (resource === "rooms") {
      if (method === "GET") {
        const result = await rooms.getRooms({
          page: page(),
          limit: limit(),
          usersRoom: boolean(query.get("usersRoom"), "usersRoom", false),
          signal: request.signal,
        });
        return respond({
          ...result,
          result: result.result
            ? { ...result.result, data: result.result.data.map(imageUrl) }
            : null,
        });
      }
      if (method === "POST") {
        const data = await body(request);
        const result = await rooms.createRoom({
          name: text(data.name, "name", 100),
          description:
            data.description === undefined || data.description === ""
              ? undefined
              : text(data.description, "description", 2000),
          image: data.image == null ? null : text(data.image, "image", 1000),
          isPublic: boolean(data.isPublic, "isPublic", true),
        });
        return respond({
          ...result,
          result: result.result ? imageUrl(result.result) : null,
        });
      }
    }
    if (path[0] !== "rooms" || !path[1])
      throw new InputError("Resource not found", 404);
    const roomId = positiveInteger(path[1], "roomId");
    if (path.length === 2 && method === "GET") {
      const result = await rooms.getRoomById(roomId, request.signal);
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
              await rooms.joinRoom({ roomId, userId: me.result.id }),
            );
          }
          break;
        case "ratings":
          if (method === "GET") {
            const sortBy = query.get("sortBy");
            const sortOrder = query.get("sortOrder");
            if (sortBy && sortBy !== "rate" && sortBy !== "userRate")
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
                    sortBy === "rate" || sortBy === "userRate"
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
              }),
            );
          }
          break;
        case "invitations":
          if (method === "GET")
            return respond(
              await rooms.invitations(roomId, page(), request.signal),
            );
          if (method === "POST") {
            const data = await body(request);
            const email = text(data.email, "email", 254);
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              throw new InputError("Invalid email");
            return respond(await rooms.inviteUser(roomId, email));
          }
          break;
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
    if (path.length === 4) {
      const id = identifier(path[3]);
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
      },
    });
  }
}
