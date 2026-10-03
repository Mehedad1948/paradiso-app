"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthResult } from "@/types/auth";

export function useAuthForm<T>(
  operation: (data: T) => Promise<AuthResult>,
  changesSession = false,
) {
  const client = useQueryClient();
  const busy = useRef(false);
  const active = useRef(true);
  const generation = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: operation,
    retry: false,
    onSuccess: async () => {
      if (changesSession) {
        await client.cancelQueries();
        client.clear();
      }
    },
  });
  const { mutateAsync, reset } = mutation;
  useEffect(() => {
    active.current = true;
    generation.current += 1;
    setValidationError(null);
    if (!busy.current) reset();
    formRef.current?.reset();
    return () => {
      active.current = false;
      generation.current += 1;
    };
  }, [reset]);
  const submit = useCallback(
    async (data: T, onSuccess: (result: AuthResult) => void) => {
      if (busy.current) return;
      busy.current = true;
      const submittedGeneration = generation.current;
      setValidationError(null);
      try {
        const result = await mutateAsync(data);
        if (active.current && generation.current === submittedGeneration)
          onSuccess(result);
      } catch {
        /* React Query exposes the failure inline; callers never get an unhandled rejection. */
      } finally {
        busy.current = false;
      }
    },
    [mutateAsync],
  );
  const clearError = useCallback(() => {
    setValidationError(null);
    if (!busy.current) reset();
  }, [reset]);
  return {
    formRef,
    submit,
    clearError,
    setError: setValidationError,
    error: validationError || mutation.error?.message,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
