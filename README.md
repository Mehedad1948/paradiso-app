# Paradiso

Room-based movie ratings, built with Next.js 16.3.8, React 19, TanStack Query 5, HeroUI 2, and Tailwind CSS 3.

## Run

Use Node.js 22.14 or newer.

```powershell
npm ci
npm run dev
```

Configure these server environment variables in `.env`:

- `BASE_API_URL`: backend API origin/base path.
- `JWT_SECRET`: the backend's JWT verification secret (used by `proxy.ts`).
- `AWS_BASE_URL`: public storage base URL; the BFF resolves room image URLs.
- `NEXT_PUBLIC_BASE_TMDB_IMAGE_URL`: public TMDB image base URL.

`BASE_API_URL` and authentication tokens stay on the server. Authentication API routes set HttpOnly, SameSite=Lax cookies; Secure is enabled in production. Access tokens must verify with `JWT_SECRET`; cookie lifetimes follow JWT expiry, with a seven-day fallback for opaque refresh tokens.

## Backend OpenAPI contracts

The source URL is configured in `openapi.config.mjs`. `openapi/backend.json` is a committed schema snapshot, and `types/generated/backend.ts` contains the TypeScript contracts generated from it. The initial snapshot came from the local `paradiso-backend/openapi.json` checkout. Request types in `types/auth.ts`, `types/rooms.ts`, and `types/ratings.ts` reference exact operations through `types/backend.ts`.

```powershell
npm run api:refresh       # Fetch the backend schema and regenerate contracts
npm run api:generate      # Regenerate contracts from the committed snapshot, offline
npm run api:check         # Fail if generated contracts differ from the snapshot
npm run api:check:remote  # Fail if either the snapshot or contracts differ from the live backend
```

Commit the snapshot and generated file together after a refresh. `api:refresh` requires access to the backend URL; `api:generate` and `api:check` work without network access. Set `OPENAPI_SCHEMA_URL` to use a different schema URL for a refresh or remote check. These are compile-time TypeScript contracts, so existing BFF input validation still handles untrusted requests at runtime.

## Authentication

Auth pages use `hooks/auth/useAuthForm.ts` and `lib/api/auth.ts` to call the same-origin `POST /api/auth/[operation]` BFF. The BFF validates inputs, calls server-only services, and returns messages rather than tokens. Registration posts to backend `/users`; other backend routes are `/auth/sign-in`, `/auth/verify-email`, `/auth/forget-password`, `/auth/reset-password`, and `/auth/refresh-tokens`.

Protected navigation preserves the requested path and query string. Expired access tokens trigger one refresh attempt from the sign-in page using the HttpOnly refresh cookie; the backend validates refresh tokens and rotates both cookies. Invalid refresh credentials clear the session; transient failures leave the form usable. The legacy refresh GET route only navigates to sign-in; session changes require POST. Return URLs reject external destinations and auth/API loops.

Sign-in, verification, refresh, password reset, and sign-out cancel private queries and clear browser query data before navigation. Shared mutation state prevents duplicate submissions, releases loading after failures, and suppresses late navigation after leaving a form. Email/return context stays encoded through registration, verification, and password reset. Reset-code resend cooldowns persist per email within the browser tab. Validation and service failures appear inline with accessible status/error messages.

## Data architecture

```text
Panel component
  -> hooks/queries/* (domain queries, guarded mutations, invalidation)
  -> lib/api/panel.ts (typed same-origin API client)
  -> app/api/bff/[...path]/route.ts
  -> lib/bff/panel.ts (resource allowlist, authentication, input validation, response mapping)
  -> services/* (server-only backend HTTP calls)
```

The BFF exposes only supported resources: session user, rooms, room ratings/movies, movie search, invitations, invite links, and room image uploads. It rejects cross-origin mutations, derives joining identity from the authenticated backend user, bounds pagination and uploads, validates dates/votes/IDs, and preserves backend authorization failures. The backend remains responsible for room membership and ownership authorization. HTTP failures become `BffError` instances; private responses use `Cache-Control: private, no-store`.

`services/backend.ts` is the server-only backend transport. Domain service methods use exact OpenAPI paths and methods, so their request bodies, query/path parameters, and success responses come from `types/generated/backend.ts`. Browser code continues to call the same-origin BFF; backend response aliases in `types/` use generated schemas, while BFF-only values such as `imageUrl` remain local extensions.

Room lists and details are client components. Route files delegate to `features/rooms/RoomsPage.tsx` and `RoomPage.tsx`; components, dialogs, invitation views, URL hooks, and pure filter parsing live together in that feature. `hooks/queries/useRoomQueries.ts`, `useInvitationQueries.ts`, and `useMe.ts` own server state; `lib/query/panel-keys.ts` defines cache identity. Components receive explicit action callbacks instead of reading route state themselves.

Room details and ratings load independently in parallel. React Query deduplicates requests, retains prior pagination results within the same room, propagates cancellation through the BFF to backend reads, and uses a 30-second freshness window with a five-minute garbage collection window. Rows from a previous room are never used as placeholders for another room. Movie searches are debounced, enabled only while the dialog is mounted, and fresh for five minutes. Queries retry transient failures twice; mutations and authentication failures do not retry.

Successful create/join operations invalidate room lists. Movie additions/removals invalidate only the room detail and ratings. Votes invalidate that room's ratings; invitation and invite-link mutations invalidate their own paginated resources. The shared mutation hook guards immediate duplicate submissions, awaits invalidation, and suppresses form callbacks after the form becomes inactive.

The URL owns shareable state: independent `myPage`/`allPage` list pagination, rating filters, and `dialog=create-room|add-movie|invite`. URL parsing bounds page sizes and rejects malformed numbers/dates before requests. Native history updates avoid another server component render; search and sort reset the ratings page to one. Search drafts cancel queued updates on navigation, while empty pages move back to the last available page after deletion. Old `addRoomModal` query links and invitation/add-movie hash links remain supported.

Create-room, add-movie, invite, vote, and delete dialogs are dynamically imported and mounted only when opened. Invitation tabs defer their inactive view and its queries. Closing a dialog discards its local form state. The first-view ratings table indexes each movie's ratings once and requests small, lazy-loaded posters. Query failures show a retry or sign-in action; mutations show errors through toast notifications.

## Cache Components

`next.config.js` enables `cacheComponents: true`. The public home page uses `use cache` with `cacheLife('hours')`. Private backend fetches explicitly use `no-store`; authentication-dependent data never enters a shared Next cache. Suspense boundaries support the panel's URL-dependent shell and the server-rendered invitation page. `proxy.ts` replaces the old middleware convention and protects panel route navigation; BFF endpoints enforce their own session checks.

The landing page WebGL effect disposes animation frames, listeners, GPU resources, and global scroll styles when hidden or unmounted so it does not continue affecting panel navigation.

## Verify

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Tests exercise the BFF's authentication/origin/validation boundaries, session-derived identity, cookie rotation/expiry, refresh failures, duplicate auth submissions, late callbacks, reset cooldowns, response errors, cancellation plumbing, query encoding, and safe session redirects. The production build also checks Cache Components prerendering. The existing Google Fonts require network access on a cold build.

HeroUI foundations are pinned to Tailwind 3-compatible releases. Remaining npm audit findings include the existing Tailwind 3/transitive tooling stack; resolving those with a Tailwind 4/HeroUI styling migration is separate from this refactor. No critical findings remain after removing unused legacy packages.
