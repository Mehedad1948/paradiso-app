"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { addToast } from "@heroui/toast";

export type MutationOptions<T> = { onSuccess?: (data: T) => void };

/** Cache effects survive navigation; form callbacks belong to the active form. */
export function usePanelMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  keys: readonly (readonly unknown[])[],
  options?: MutationOptions<T>,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, []);
  const mutation = useMutation({
    mutationFn: ({ variables }: { variables: V; generation: number }) =>
      mutationFn(variables),
    retry: false,
    onSuccess: async (data, submitted) => {
      await Promise.all(
        keys.map((queryKey) =>
          client.invalidateQueries({ queryKey, exact: false }),
        ),
      );
      if (generation.current === submitted.generation)
        options?.onSuccess?.(data);
    },
    onError: (error, submitted) => {
      if (generation.current === submitted.generation)
        addToast({ title: error.message, color: "danger" });
    },
    onSettled: () => {
      busy.current = false;
    },
  });
  const { mutate } = mutation;
  const execute = useCallback(
    (variables: V) => {
      if (busy.current) return;
      busy.current = true;
      mutate({ variables, generation: generation.current });
    },
    [mutate],
  );
  return { execute, isPending: mutation.isPending, error: mutation.error };
}
