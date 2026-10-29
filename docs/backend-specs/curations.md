# Spec: Curated landing lists (poster grid + editors' picks)

## Goal

The home page has two hand-curated movie sections. Today the frontend resolves them by scanning
`GET /movies` page by page. Replace that with a small "curations" feature: two public read
endpoints and admin endpoints to edit them.

| Key | Landing section | Shape |
|---|---|---|
| `landing-grid` | Stepped poster grid ("Gather / Pick / Judge") | Fixed **slots** (positions matter) |
| `editors-picks` | Shelf carousel ("Tonight's lineup, already on the shelf") | Unordered **pool** of up to 40 films |

The frontend caches both responses and invalidates them itself when the admin saves. The backend
needs no caching, scheduling or randomness for this feature.

## Conventions to follow (match the existing API)

- Follow the patterns of `/featured-artists` (public) and `/admin/featured-artists` (admin).
- Admin routes live under `/admin/...` and are guarded by the existing admin role check
  ("Requires role: admin" in the OpenAPI description).
- Public routes need no auth.
- Responses carry `apiVersion` like the other endpoints; errors use the existing `ErrorResponse`.
- **Every route, DTO and field must be fully described in the OpenAPI document.** The frontend
  generates its types from it.
- "Movie" means a **library** movie: the existing `Movie` entity, uuid `id`, with `dbId` = TMDb id.

## Data model

```
Curation
  key           enum('landing-grid', 'editors-picks')  PK
  updatedAt     timestamp
  updatedBy     user id (nullable)

CurationItem
  id            uuid PK
  curationKey   FK -> Curation.key
  movieId       uuid FK -> Movie.id, ON DELETE CASCADE
  slot          int        -- landing-grid: grid cell index; editors-picks: display order (0..n-1)
  imageUrl      text null  -- landing-grid only, see below
  objectPosition text null -- landing-grid only, CSS object-position such as "center 35%"
  createdAt     timestamp

  UNIQUE (curationKey, slot)
```

- **Grid images matter.** The grid's design is a color flow (green → blue → purple → red → yellow),
  so each slot uses a hand-graded image, not the plain TMDb poster. `imageUrl` holds that image.
  When it is null, the frontend falls back to the movie's `poster_path`. Accept an absolute
  `https://` URL (for example an upload from the existing `/uploads/file`) or a site-relative path
  starting with `/` (served by the frontend's `public/` folder).
- In `landing-grid` the same movie **may appear in more than one slot** (the current design repeats
  two films). In `editors-picks`, each movie may appear only once.
- Deleting a movie from the library removes its curation items (cascade).
- Both `Curation` rows always exist (create them in the migration). An empty list is valid.

## Constants

```
LANDING_GRID_SLOTS = 27      // valid slots: 0..26, row-major order of the frontend's grid cells
EDITORS_PICKS_MAX  = 40
```

## Shared response shape

```ts
CuratedMovie {
  id: string            // uuid, library movie id
  dbId: number | null   // TMDb id
  title: string
  poster_path: string | null
  release_date: string | null
}
```

## Public endpoints

### `GET /curations/landing-grid`

```ts
200 {
  data: Array<{
    slot: number                 // 0..26
    imageUrl: string | null
    objectPosition: string | null
    movie: CuratedMovie
  }>                             // sorted by slot asc; empty slots are omitted
  updatedAt: string              // ISO date-time
  apiVersion: string
}
```

### `GET /curations/editors-picks`

Returns the **whole pool**. Do **not** randomize or limit it on the backend. The frontend picks the
day's subset with a date-seeded shuffle so the selection stays stable for the whole day.

```ts
200 {
  data: Array<{ movie: CuratedMovie }>   // in admin-defined order (slot asc)
  updatedAt: string
  apiVersion: string
}
```

## Admin endpoints (Requires role: admin)

Both lists are edited as a whole: the admin UI loads the full list, edits it locally and saves it
in one call. **PUT replaces the whole list in a single transaction**, so no per-item endpoints are
needed.

### `GET /admin/curations/landing-grid`
### `GET /admin/curations/editors-picks`

Same body as the public endpoints, plus `updatedBy` (`{ id, username } | null`). Any movie in the
list that has no poster is still returned, so the admin can see and fix it.

### `PUT /admin/curations/landing-grid`

```ts
body {
  items: Array<{
    slot: number                 // 0..26, unique within the request
    movieId: string              // uuid of a library movie
    imageUrl?: string | null
    objectPosition?: string | null
  }>
}
200 -> same body as GET /admin/curations/landing-grid
```

### `PUT /admin/curations/editors-picks`

```ts
body { movieIds: string[] }      // ordered, unique, 0..40 entries
200 -> same body as GET /admin/curations/editors-picks
```

### Validation and errors

| Case | Status |
|---|---|
| Slot outside `0..26`, duplicate slot, or duplicate `movieId` in editors-picks | 400 |
| More than 40 editors' picks | 400 |
| `imageUrl` that is neither an `https://` URL nor a path starting with `/` | 400 |
| `objectPosition` longer than 40 characters | 400 |
| A `movieId` not found in the library | 422 (message names the missing ids) |
| An editors' pick whose movie has no `poster_path` (the shelf needs a poster) | 422 |
| Not authenticated / not admin | 401 / 403 (existing guard behavior) |

On success, set `Curation.updatedAt` and `updatedBy`.

## Library search for the admin picker

The admin UI needs to find library movies by title. `GET /movies` has no text search today. Add an
optional `search` query parameter to `GET /movies`: a case-insensitive match on `title` and
`original_title`, combined with the existing pagination. Document it in OpenAPI.

## Seed (migration)

Seed `landing-grid` with the current hard-coded grid so nothing changes visually. Find each movie by
`dbId` (TMDb id). Skip any film that isn't in the library and log it. `imageUrl` values are
frontend-relative paths that already exist.

| slot | TMDb id | title | imageUrl | objectPosition |
|---|---|---|---|---|
| 0 | 8967 | The Tree of Life | /posters/grids/blue/tree-of-life.jpg | center |
| 1 | 144 | Wings of Desire | /posters/grids/blue/wings-of-desire.jpg | center |
| 2 | 567 | Rear Window | /posters/grids/purple/rear-window.jpg | center |
| 3 | 313369 | La La Land | /posters/grids/purple/lalaland.jpg | center |
| 4 | 2013 | The Diving Bell and the Butterfly | /posters/grids/green/diving-bell.jpg | center 40% |
| 5 | 54328 | Ocean Heaven | /posters/grids/blue/ocean-heaven.jpg | center |
| 6 | 116745 | The Secret Life of Walter Mitty | /posters/grids/blue/walter-mitty.jpg | center |
| 7 | 245891 | John Wick | /posters/grids/blue/jhon-weak.jpg | center 30% |
| 8 | 152601 | Her | /posters/grids/her.jpg | center 30% |
| 9 | 603 | The Matrix | /posters/grids/green/matrix.jpg | center 35% |
| 10 | 1398 | Stalker | /posters/grids/green/stalker.jpg | center |
| 11 | 655 | Paris, Texas | /posters/grids/blue/paris-texas.jpg | center 35% |
| 12 | 37165 | The Truman Show | /posters/grids/blue/trueman-show.jpg | center 35% |
| 13 | 429200 | Good Time | /posters/grids/red/good-times.jpg | center |
| 14 | 110 | Three Colors: Red | /posters/grids/red/color-red.jpg | center 35% |
| 15 | 8967 | The Tree of Life | /posters/grids/blue/tree-of-life.jpg | center |
| 16 | 77 | Memento | /posters/grids/red/meemnto.jpg | center 35% |
| 17 | 582 | The Lives of Others | /posters/grids/red/life-of-others.jpg | center |
| 18 | 426 | Vertigo | /posters/grids/red/vertigo.jpg | center |
| 19 | 194 | Amélie | /posters/grids/red/ameli.jpg | center |
| 20 | 632 | Stalag 17 | /posters/grids/red/stalag-17.jpg | center |
| 21 | 693134 | Dune: Part Two | /posters/grids/red/dune.webp | center |
| 22 | 10315 | Fantastic Mr. Fox | /posters/grids/yellow/fantastic-fox.jpg | center |
| 23 | 24 | Kill Bill | /posters/grids/yellow/kill-bill.jpg | center |
| 24 | 103 | Taxi Driver | /posters/grids/yellow/taxi-driver.jpg | center |
| 25 | 389 | 12 Angry Men | /posters/grids/yellow/12-angry-man.jpg | center |
| 26 | 10315 | Fantastic Mr. Fox | /posters/grids/yellow/fantastic-fox.jpg | center |

Leave `editors-picks` empty. Until it has picks, the frontend keeps its current fallback (the first
library films that have a poster).

## Out of scope

- No backend caching or cache headers: the frontend caches both lists and invalidates them on save.
- No randomness or rotation on the backend.
- No per-item add/remove routes.

## Acceptance checklist

- [ ] Migration creates both `Curation` rows and seeds `landing-grid` as listed above.
- [ ] `GET /curations/landing-grid` and `GET /curations/editors-picks` work without auth.
- [ ] Both admin GET and PUT routes reject non-admins; PUT replaces the list atomically.
- [ ] Every validation case in the table returns the stated status with a clear message.
- [ ] Deleting a library movie removes its curation items.
- [ ] `GET /movies?search=` matches titles case-insensitively and keeps pagination.
- [ ] Everything is documented in OpenAPI, including the new `search` parameter.
- [ ] Tests cover the PUT validation cases and the replace-in-one-transaction behavior.
