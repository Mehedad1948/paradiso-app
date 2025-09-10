// hooks/use-server-query.ts
import { getErrorMessage } from "@/lib/functions/getErrorMessage";
import { addToast } from "@heroui/toast";
import { useState, useEffect, useCallback } from "react";

type ActionReturn<T extends (...args: any[]) => Promise<any>> = Awaited<
  ReturnType<T>
>;

export function useServerQuery<T extends (...args: any[]) => Promise<any>>(
  action: T,
  dependencies: any[] = [],
) {
  const [data, setData] = useState<ActionReturn<T>["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [refetchCounter, setRefetchCounter] = useState(0);

  const fetchData = useCallback(
    async (...args: Parameters<T>) => {
      setIsLoading(true);
      setIsError(false);

      try {
        const res: ActionReturn<T> = await action(...args);

        if (res.success) {
          setData(res.data);
        } else {
          setIsError(true);
          addToast({
            title: res.message || "An unexpected error occurred.",
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
    fetchData(...(dependencies as Parameters<T>));
  }, [fetchData, refetchCounter, ...dependencies]);

  const refetch = useCallback(() => {
    setRefetchCounter((prev) => prev + 1);
  }, []);

  return { data, isLoading, isError, refetch };
}
