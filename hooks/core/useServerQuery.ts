// hooks/use-server-query.ts
import { getErrorMessage } from "@/lib/functions/getErrorMessage";
import { RequestResult } from "@/types/request";
import { addToast } from "@heroui/toast";
import { useState, useEffect, useCallback } from "react";

export function useServerQuery<T, Args extends any[] = any[]>(
  action: (...args: Args) => Promise<RequestResult<T>>,
  dependencies: Args = [] as unknown as Args,
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [refetchCounter, setRefetchCounter] = useState(0);

  const fetchData = useCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setIsError(false);

      try {
        const res = await action(...args);

        if (res.response.ok) {
          setData(res.result);
        } else {
          setIsError(true);
          addToast({
            title: res.response.message || "An unexpected error occurred.",
            color: "danger",
          });
        }
      } catch (err) {
        setIsError(true);
        addToast({
          title: getErrorMessage(err) || "An unexpected error occurred.",
          color: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [action],
  );

  useEffect(() => {
    fetchData(...dependencies);
  }, [refetchCounter, ...dependencies]);

  const refetch = useCallback(() => {
    setRefetchCounter((prev) => prev + 1);
  }, []);

  return { data, isLoading, isError, refetch };
}
