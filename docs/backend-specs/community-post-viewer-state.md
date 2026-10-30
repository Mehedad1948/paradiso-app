# Spec: Embed live repost data and watchlist state in community posts

## Goal

Community feeds currently make the frontend send **one extra request per card** to complete what a
post response leaves out:

1. **Reposts.** A post with `kind: "repost"` carries `quotedPost`, a snapshot of the original post
   with no counts and no viewer state. The card shows the *original* post's likes, replies, reposts
   and the viewer's own reaction, so the frontend calls `GET /community/posts/{originalId}` for every
   repost it shows.
2. **Watchlist button.** Every post that recommends a film has a "save to watchlist" button whose
   filled/empty state needs `GET /watchlist/{movieId}`. A page of 20 film posts costs 20 requests
   for a signed-in viewer.

The frontend now delays both requests until a card scrolls close to the screen, which spreads the
load out, but every card the reader actually sees still costs a request. Put this data in the post
responses and both requests go away.

## Conventions to follow (match the existing API)

- Response shapes stay backwards compatible: **add fields only**, never rename or remove.
- Viewer-relative fields follow the existing `myReaction` / `reposted` pattern: computed for the
  authenticated caller, and the "nothing" value (`null` / `false`) for anonymous callers.
- **Every new field must be described in the OpenAPI document** (`CommunityPost` schema). The
  frontend generates its types from it (`types/generated/backend.ts`).
- Fill these fields with **one batched query per page** (e.g. `WHERE post_id IN (...)` /
  `WHERE movie_id IN (...)`), not one query per post. Otherwise the per-card cost just moves from
  the frontend to the database.

## Change 1: `quotedPost` carries the original's live counts and viewer state

Today (`components["schemas"]["CommunityPost"]["quotedPost"]`):

```ts
quotedPost: {
  id: number
  text: string
  rating: number | null
  imageUrl: string | null
  createdAt: string            // date-time
  author: PublicUser
  movie: { id: string /* uuid */, dbId: number | null, title: string, poster_path: string | null } | null
} | null
```

Add these fields, with the same meaning they have on a top-level `CommunityPost`:

```ts
quotedPost: {
  ...existing fields
  updatedAt: string                    // date-time
  room: { id: number, name: string } | null
  commentCount: number
  likeCount: number
  dislikeCount: number
  repostCount: number
  quoteCount: number
  myReaction: 1 | -1 | null            // the caller's reaction to the ORIGINAL post
  reposted: boolean                    // whether the caller has reposted the ORIGINAL post
} | null
```

Rules:

- Applies to `kind: "repost"` **and** `kind: "quote"`, so the schema has one shape. (Quote cards
  only display author, text and media today, but a single shape keeps the types simple.)
- Counts must be **live**: those of the original post at response time, not copied when the repost
  was created.
- If the original has been deleted, keep returning `quotedPost: null` as today.
- If the caller can no longer see the original (e.g. it is in a room they have left), apply the same
  visibility rule `GET /community/posts/{id}` uses for that caller. If that endpoint would return
  403/404, `quotedPost` is `null`.

## Change 2: film posts say whether the film is on the caller's watchlist

Add `inWatchlist` to the `movie` object, on both the post itself and `quotedPost`:

```ts
movie: {
  id: string          // uuid
  dbId: number | null
  title: string
  poster_path: string | null
  inWatchlist: boolean   // NEW: true when the film is on the caller's watchlist; false for anonymous callers
} | null
```

Rules:

- The value must match what `GET /watchlist/{movieId}` (`WatchlistStatusResponse.inWatchlist`) would
  return for the same caller at the same moment.
- Keep `GET /watchlist/{movieId}` as it is. Other pages use it, and the frontend still uses it after
  a toggle.

## Endpoints affected

Every route that returns `CommunityPost` (or a `CursorPage<CommunityPost>`) must include both changes:

| Route | Returns |
| --- | --- |
| `GET /community/posts` (with or without `authorId`, `movieId`, `before`) | `CursorPage<CommunityPost>` |
| `GET /community/following` | `CursorPage<CommunityPost>` |
| `GET /community/rooms/{roomId}/posts` | `CursorPage<CommunityPost>` |
| `GET /community/posts/{postId}` | `CommunityPost` |
| `POST /community/posts` | `CommunityPost` |
| `PATCH /community/posts/{postId}` | `CommunityPost` |
| `POST /community/posts/{postId}/repost` | `CommunityPost` (the new repost) |

## Acceptance criteria

- [ ] A feed page that contains reposts returns, for each one, `quotedPost` with counts equal to
      those of `GET /community/posts/{quotedPost.id}`, plus `myReaction` and `reposted` for the caller.
- [ ] After the caller likes the original post, the next feed response shows the new `likeCount`
      and `myReaction: 1` on **every** repost of it.
- [ ] Every non-null `movie` (top-level and inside `quotedPost`) has `inWatchlist`; it is `false`
      for unauthenticated requests.
- [ ] Adding a film with `PUT /watchlist/{movieId}` makes the next feed response report
      `inWatchlist: true` on posts recommending that film.
- [ ] Database query count for one feed page does not grow with the number of posts on it
      (verify with query logging on a page of 20).
- [ ] The OpenAPI document describes all new fields; regenerating the frontend types adds them to
      `CommunityPost` with no other changes.

## Out of scope

- No new endpoints and no changes to request bodies.
- No caching changes. Feed responses already depend on the caller (`myReaction`), so they stay
  uncacheable per user.

## Frontend follow-up (for reference, done in the frontend repo after this ships)

- `PostCard.tsx` (`Repost` / `snapshot`) will build the original post from `quotedPost` directly and
  stop calling `usePost` for reposts in the feed.
- `PostActions.tsx` (`WatchlistButton`) will seed its watchlist-status query from
  `movie.inWatchlist` and stop requesting `GET /watchlist/{movieId}` per card.
