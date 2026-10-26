import "server-only";
import community from "@/services/community";
import { moviesServices } from "@/services/movies";
import type { RequestResult } from "@/types/request";
import {
  COMMUNITY_LIMITS,
  type CommunityPost,
  type CreatePostInputs,
  type ResolvedMovie,
  type UpdatePostInputs,
} from "@/types/community";
import {
  commentTextError,
  imageUrlError,
  postTextError,
  ratingError,
} from "@/lib/community/validation";
import { InputError, positiveInteger } from "./validation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** How far to scan the movie library when TMDb says a film already exists. */
const LIBRARY_SCAN_PAGES = 20;

function uuidOf(value: unknown, name: string) {
  if (typeof value !== "string" || !uuid.test(value)) throw new InputError(`Invalid ${name}`);
  return value;
}

function check(error: string | undefined) {
  if (error) throw new InputError(error);
}

function postText(value: unknown) {
  if (typeof value !== "string") throw new InputError("Invalid text");
  check(postTextError(value));
  return value.trim();
}

function rating(value: unknown) {
  check(ratingError(value));
  return value as number;
}

function imageUrl(value: unknown) {
  // The backend rejects null, so a custom image can be replaced but not cleared.
  check(imageUrlError(value));
  return value as string;
}

/** Room images are storage keys; posters stay relative TMDb paths for the client. */
function withRoomImage<T extends Pick<CommunityPost, "promotion">>(post: T): T {
  const image = post.promotion?.room.image;
  if (!image || /^https?:\/\//.test(image)) return post;
  return {
    ...post,
    promotion: {
      ...post.promotion!,
      room: { ...post.promotion!.room, image: `${process.env.AWS_BASE_URL || ""}${image}` },
    },
  };
}

function mapResult<T, R>(result: RequestResult<T>, map: (value: T) => R): RequestResult<R> {
  return { ...result, result: result.result ? map(result.result) : null };
}

const page = <T extends { data: CommunityPost[] }>(value: T) => ({
  ...value,
  data: value.data.map(withRoomImage),
});

/** Creates the film locally, or finds the existing copy, and returns its UUID. */
async function resolveMovie(tmdbId: number): Promise<RequestResult<ResolvedMovie>> {
  const details = await moviesServices.tmdbMovie(tmdbId);
  if (!details.response.ok || !details.result) return { ...details, result: null };
  const movie = details.result;
  const created = await moviesServices.create({
    dbId: movie.id,
    title: movie.title,
    original_title: movie.original_title || null,
    overview: movie.overview || null,
    release_date: movie.release_date || null,
    poster_path: movie.poster_path ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    popularity: movie.popularity ?? null,
    vote_average: movie.vote_average ?? null,
    vote_count: movie.vote_count ?? null,
    original_language: movie.original_language || null,
    adult: movie.adult ?? null,
    genres: movie.genres.map(({ id, name }) => ({ id, name })),
  });
  const pick = (value: { id: string; dbId: number | null; title: string; poster_path?: string | null }) => ({
    id: value.id,
    dbId: value.dbId,
    title: value.title,
    poster_path: value.poster_path ?? null,
  });
  if (created.response.ok && created.result) return { ...created, result: pick(created.result) };
  if (created.response.status !== 409) return { ...created, result: null };
  // There is no lookup by TMDb id yet, so page through the library for the existing copy.
  for (let index = 1; index <= LIBRARY_SCAN_PAGES; index++) {
    const list = await moviesServices.list(index, 100);
    if (!list.response.ok || !list.result) return { ...list, result: null };
    const found = list.result.data.find((item) => item.dbId === tmdbId);
    if (found) return { ...list, result: pick(found) };
    if (index >= list.result.meta.totalPages) break;
  }
  return {
    result: null,
    response: {
      ok: false,
      status: 409,
      statusText: "",
      message: "This film is in the library but couldn't be located. Pick it from one of your rooms instead.",
    },
  };
}

/** Routes `/community/*`; `path` is the part after `community`. */
export async function handleCommunityRequest({
  path,
  method,
  query,
  data,
  signal,
  signedIn,
}: {
  path: string[];
  method: string;
  query: URLSearchParams;
  data: () => Promise<Record<string, unknown>>;
  signal: AbortSignal;
  signedIn: boolean;
}): Promise<RequestResult<unknown>> {
  const auth = () => {
    if (!signedIn) throw new InputError("Sign in to continue", 401);
  };
  const cursor = () => ({
    limit: positiveInteger(query.get("limit"), "limit", COMMUNITY_LIMITS.pageSize, 100),
    before: query.has("before") ? positiveInteger(query.get("before"), "before") : undefined,
  });
  const filters = () => ({
    ...cursor(),
    authorId: query.has("authorId") ? positiveInteger(query.get("authorId"), "authorId") : undefined,
    movieId: query.has("movieId") ? uuidOf(query.get("movieId"), "movieId") : undefined,
  });
  const [resource, rawId, action, rawSubId] = path;

  if (path.length === 1) {
    if (resource === "posts" && method === "GET")
      return mapResult(await community.feed(filters(), signal), page);
    if (resource === "posts" && method === "POST") {
      auth();
      const body = await data();
      // A film is optional, and a rating only makes sense with one.
      if (body.rating !== undefined && body.movieId === undefined)
        throw new InputError("Tag a film to rate it");
      const input: CreatePostInputs = {
        text: postText(body.text),
        ...(body.movieId === undefined ? {} : { movieId: uuidOf(body.movieId, "movieId") }),
        ...(body.rating === undefined ? {} : { rating: rating(body.rating) }),
        ...(body.imageUrl === undefined ? {} : { imageUrl: imageUrl(body.imageUrl) }),
        ...(body.roomId === undefined ? {} : { roomId: positiveInteger(body.roomId, "roomId") }),
        ...(body.quotedPostId === undefined
          ? {}
          : { quotedPostId: positiveInteger(body.quotedPostId, "quotedPostId") }),
        ...(body.promotedInviteToken === undefined
          ? {}
          : { promotedInviteToken: uuidOf(body.promotedInviteToken, "invite token") }),
      };
      return mapResult(await community.create(input), withRoomImage);
    }
    if (resource === "following" && method === "GET") {
      auth();
      return mapResult(await community.following(filters(), signal), page);
    }
  }

  if (resource === "movies" && rawId === "resolve" && path.length === 2 && method === "POST") {
    auth();
    return resolveMovie(positiveInteger((await data()).tmdbId, "tmdbId"));
  }

  if (resource === "rooms" && action === "posts" && path.length === 3 && method === "GET")
    return mapResult(
      await community.roomFeed(positiveInteger(rawId, "roomId"), cursor(), signal),
      page,
    );

  if (resource === "posts" && rawId) {
    const postId = positiveInteger(rawId, "postId");
    if (path.length === 2) {
      if (method === "GET") return mapResult(await community.post(postId, signal), withRoomImage);
      if (method === "DELETE") {
        auth();
        return community.delete(postId);
      }
      if (method === "PATCH") {
        auth();
        const body = await data();
        const input: UpdatePostInputs = {
          ...(body.text === undefined ? {} : { text: postText(body.text) }),
          ...(body.rating === undefined ? {} : { rating: rating(body.rating) }),
          ...(body.imageUrl === undefined ? {} : { imageUrl: imageUrl(body.imageUrl) }),
        };
        if (!Object.keys(input).length) throw new InputError("Nothing to update");
        return mapResult(await community.update(postId, input), withRoomImage);
      }
    }
    if (action === "reaction" && path.length === 3) {
      if (method === "PUT") {
        auth();
        const { value } = await data();
        if (value !== 1 && value !== -1) throw new InputError("Invalid reaction");
        return community.react(postId, value);
      }
      if (method === "DELETE") {
        auth();
        return community.removeReaction(postId);
      }
    }
    if (action === "repost" && path.length === 3 && (method === "POST" || method === "DELETE")) {
      auth();
      return method === "POST"
        ? mapResult(await community.repost(postId), withRoomImage)
        : community.undoRepost(postId);
    }
    if (action === "comments") {
      if (path.length === 3 && method === "GET")
        return community.comments(postId, cursor(), signal);
      if (path.length === 3 && method === "POST") {
        auth();
        const { text } = await data();
        if (typeof text !== "string") throw new InputError("Invalid text");
        check(commentTextError(text));
        return community.comment(postId, text.trim());
      }
      if (path.length === 4 && method === "DELETE") {
        auth();
        return community.deleteComment(postId, positiveInteger(rawSubId, "commentId"));
      }
    }
  }

  // Matched before users/:id, which would reject "suggested" as an id.
  if (resource === "users" && rawId === "suggested" && path.length === 2 && method === "GET")
    return community.suggestedUsers(cursor().limit, signal);

  if (resource === "users" && rawId) {
    const userId = positiveInteger(rawId, "userId");
    if (path.length === 2 && method === "GET") return community.profile(userId, signal);
    if (path.length === 3) {
      if (action === "follow" && (method === "PUT" || method === "DELETE")) {
        auth();
        return method === "PUT" ? community.follow(userId) : community.unfollow(userId);
      }
      if (action === "followers" && method === "GET")
        return community.followers(userId, cursor(), signal);
      if (action === "following" && method === "GET")
        return community.followingUsers(userId, cursor(), signal);
      if (action === "recommendations" && method === "GET")
        return community.recommendations(userId, cursor(), signal);
    }
  }
  throw new InputError("Resource or method not found", 404);
}
