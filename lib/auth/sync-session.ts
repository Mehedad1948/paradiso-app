import type { QueryClient } from "@tanstack/react-query";
import { panelKeys } from "@/lib/query/panel-keys";

/**
 * Makes the page reflect a session that was just created, without leaving it. The sign-in pages
 * clear the cache and hard-navigate; this keeps mounted queries on screen and swaps their data.
 *
 * Resolves once `/me` knows the new viewer. Everything else refreshes in the background.
 */
export async function syncSession(client: QueryClient, refreshRoute: () => void) {
  await client.cancelQueries();
  // Whatever nobody is watching may belong to a previous account; refetch it on next use.
  client.removeQueries({ type: "inactive" });
  const isViewer = (key: readonly unknown[]) => key[0] === panelKeys.me[0];
  const viewer = client.invalidateQueries({ predicate: (query) => isViewer(query.queryKey) });
  void client.invalidateQueries({ predicate: (query) => !isViewer(query.queryKey) });
  await viewer;
  // Drops prefetched redirects to sign-in held by the router and re-renders server components.
  refreshRoute();
}
