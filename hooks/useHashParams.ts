import { useEffect, useState, useCallback } from "react";
import useSizeController from "./useSizeController";

type InputType = Record<string, string | number | boolean>;

interface SetOptions {
  noDesktopHistory?: boolean;
  noMobileHistory?: boolean;
}

export function useHashParams() {
  const [hashParams, setHashParamsState] = useState<Record<string, string>>({});
  const { isSmall } = useSizeController();

  const parseHash = useCallback((): Record<string, string> => {
    const hash = window.location.hash.replace(/^#/, "");
    const result: Record<string, string> = {};
    if (hash) {
      hash.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key) result[key] = value || "";
      });
    }
    return result;
  }, []);

  useEffect(() => {
    setHashParamsState(parseHash());
  }, [parseHash]);

  useEffect(() => {
    const update = () => setHashParamsState(parseHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [parseHash]);

  const setHashParams = useCallback(
    (argArray: InputType[], options?: SetOptions) => {
      setHashParamsState(() => {
        const updated: Record<string, string> = { ...hashParams };

        argArray.forEach((obj) => {
          Object.entries(obj).forEach(([key, value]) => {
            updated[key] = value.toString();
          });
        });

        const newHash = Object.entries(updated)
          .map(([k, v]) => `${k}=${v}`)
          .join("&");

        if (
          (!isSmall && options?.noDesktopHistory) ||
          (isSmall && options?.noMobileHistory)
        ) {
          history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}#${newHash}`,
          );
        } else {
          window.location.hash = newHash;
        }

        return updated;
      });
    },
    [isSmall, ...Object.keys(hashParams)],
  );

  const deleteHashParams = useCallback((keys: string[]) => {
    setHashParamsState((prev) => {
      const updated = { ...prev };
      keys.forEach((key) => {
        delete updated[key];
      });

      const newHash = Object.entries(updated)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");

      history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${newHash}`,
      );

      return updated;
    });
  }, []);

  return { hashParams, setHashParams, deleteHashParams };
}
