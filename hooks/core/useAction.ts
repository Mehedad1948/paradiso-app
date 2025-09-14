// hooks/use-action.ts
"use client";

import { useState } from "react";
import { addToast } from "@heroui/toast"; // Or any toast library like react-toastify

// The ActionReturn utility type correctly infers the resolved data type
type ActionReturn<T extends (...args: any[]) => Promise<any>> = Awaited<
  ReturnType<T>
>;

export function useAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options?: {
    onSuccess?: (data: ActionReturn<T>["data"]) => void;
    onError?: (message: string) => void;
  },
) {
  const [data, setData] = useState<ActionReturn<T>["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const execute = async (...args: Parameters<T>) => {
    setIsLoading(true);
    setIsError(false);

    try {
      // Call the Server Action
      const res: ActionReturn<T> = await action(...args);
      const response = res

      if (response.response.ok) {
        setData(response.result);
        if (options?.onSuccess) {
          options.onSuccess(response.result);
        }
      } else {
        setIsError(true);

        console.log("errr", response.result);

        addToast({
          title: response.result,
          color: "danger",
        });
        if (options?.onError) {
          options.onError(response);
        }
      }
      return response;
    } catch (err: any) {
      setIsError(true);
      addToast({
        title: err.message || "An unexpected error occurred.",
        color: "danger",
      });
      if (options?.onError) {
        options.onError(err.message || "An unexpected error occurred.");
      }
      // Return a standard error structure for external handling
      return { success: false, message: err.message, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, data, isLoading, isError };
}
