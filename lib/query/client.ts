import { QueryClient } from "@tanstack/react-query";
import { BffError } from "@/lib/api/client";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (count, error) =>
          count < 2 &&
          !(
            error instanceof BffError &&
            error.status > 0 &&
            error.status < 500
          ),
      },
      mutations: { retry: false },
    },
  });
}
