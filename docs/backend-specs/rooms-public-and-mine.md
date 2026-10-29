# Spec: Split the rooms list into a public endpoint and a "my rooms" endpoint

## Goal

Today one route, `GET /rooms?usersRoom=true|false`, serves two very different lists:

- **Discover rooms** (`usersRoom=false`): every public room. The same for every visitor, so it can be cached.
  It must also work **without a session**, so signed-out visitors can browse the public rooms.
- **Your rooms** (`usersRoom=true`): the caller's rooms, including per-user data (unread counts). Never cacheable.

Split them into two routes so the public list can be unauthenticated and cached, and the private one
stays authenticated. Today an anonymous `GET /rooms?usersRoom=false` returns
`401 {"message":"Unauthorized","statusCode":401}`, which is what blocks the signed-out rooms page.

## Conventions to follow (match the existing API)

- Same patterns as `/featured-artists`, which is public and read-only.
- Responses carry `apiVersion`, and errors use the existing `ErrorResponse`.
- Pagination is the existing `page` / `limit` (default `limit` 10, max 100) with `meta` + `links`.
- **Every route, DTO and field must be fully described in the OpenAPI document.** The frontend
  generates its types from it.

## Endpoints

### `GET /rooms/public`  (no auth)

Lists rooms where `isPublic = true`, newest first (`createdAt desc`, tie-break `id desc`).

```
query
  page?   int  >= 1, default 1
  limit?  int  1..100, default 10
```

```ts
200 {
  data: Array<PublicRoomListItem>
  meta: PaginationMeta
  links: PaginationLinks
  apiVersion: string
}
```

```ts
PublicRoomListItem {
  id: number
  name: string
  description: string | null
  image: string | null
  isPublic: true
  themeColor: string | null
  owner: { id: number, username: string }
  users: PublicUser[]        // all members, same as RoomListItem.users today (see "Membership" below)
  movieCount: number         // replaces the movies[] array; the list card only needs the count
}
```

Rules:

- **The body must be identical for every caller.** No per-viewer fields (no `unreadCount`, no
  `isMember`, no `movies[]` with genres). Reading the `Authorization` header must not change the response.
- **Never return a private room**, even to its members or owner. Members see their private rooms
  via `GET /rooms/mine`.
- Route order: register `/rooms/public` and `/rooms/mine` **before** `/rooms/{id}` so they are not
  parsed as ids.

#### Caching headers

The frontend proxy forwards the response and wants it cacheable, so the backend should send:

```
Cache-Control: public, max-age=30, s-maxage=60, stale-while-revalidate=300
ETag: <weak etag of the body>        // 304 on If-None-Match
Vary: Accept-Encoding                // not Authorization / Cookie
```

Rooms change often (joins, new rooms), so keep the TTL short. A minute of staleness is fine.
Do not add cache invalidation logic.

#### Membership

The frontend decides whether to show "Enter" or "Join" on a card by checking whether the signed-in
user's id is in `users`. That is why `users` stays in the response. If member lists can get very
large, tell us and we will switch to a different approach (for example, frontend compares against
`GET /rooms/mine` ids). Do not drop `users` without telling us first.

### `GET /rooms/mine`  (auth required)

The caller's rooms (owner or member), public and private. This is today's `usersRoom=true`
behavior, unchanged:

```
query  page?, limit?, (startDate?, endDate? as today)
200 RoomListResponse        // existing schema, includes unreadCount, movies[], etc.
401 when not authenticated  // existing guard
```

Never cacheable: send `Cache-Control: private, no-store`.

### `GET /rooms`  (existing, deprecate)

Keep working during the migration so nothing breaks. Mark it `deprecated: true` in OpenAPI with a
note pointing to the two routes above. The frontend will stop calling it; it can be removed in a later release.
Do not change its auth behavior.

## What stays the same

- `GET /rooms/{id}` and every other room route stay authenticated. Only the **list** of public rooms is open.
- Creating, joining and leaving rooms are unchanged.

## Validation and errors

| Case | Status |
|---|---|
| `page` < 1, `limit` < 1 or > 100, or not integers | 400 |
| `/rooms/mine` without a valid session | 401 (existing guard) |
| `/rooms/public` with an invalid or expired token | still 200 (the token is ignored, never a 401) |

## Acceptance checklist

- [ ] `GET /rooms/public` works with no `Authorization` header and returns only public rooms.
- [ ] `GET /rooms/public` returns the same body with and without a valid token (no per-viewer fields).
- [ ] `GET /rooms/public` sends the cache headers above and answers `If-None-Match` with 304.
- [ ] `GET /rooms/mine` requires auth, returns public and private rooms the caller belongs to, and sends `no-store`.
- [ ] `/rooms/public` and `/rooms/mine` are not shadowed by `/rooms/{id}`.
- [ ] `GET /rooms` still works and is marked deprecated in OpenAPI.
- [ ] Both new routes, `PublicRoomListItem` and the pagination params are fully documented in OpenAPI.
- [ ] Tests cover: anonymous public list, private rooms never leak, pagination bounds, `mine` rejects anonymous callers.

## Frontend follow-up (for reference, not backend work)

Once deployed, the frontend will: call `/rooms/public` from the BFF without a session and with public
cache headers, call `/rooms/mine` only for signed-in users, and regenerate its types from OpenAPI.
