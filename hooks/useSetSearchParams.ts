import { useDebouncedCallback } from "use-debounce";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useMemo } from "react";
import useSizeController from "./useSizeController";

const useSetSearchParams = (defaultPath?: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entries = searchParams.entries();
  const mainParams: {
    [key: string]: string;
  } = useParams();

  const path = usePathname();

  const params: { [key: string]: string } = {};

  for (const [key, value] of Array.from(entries)) {
    params[key] = value;
  }

  const { placeholder } = useParams();

  interface InputType {
    [key: string]: string | number;
  }

  const getSearchParamsString = (pairToReplace?: [string, string][]) => {
    const updatedParams = new URLSearchParams(params);

    pairToReplace?.forEach(([key, value]) => {
      updatedParams.set(key, value); // Replaces if exists, adds if not
    });

    return updatedParams.toString();
  };

  const setSearchParam = (
    argArray: InputType[],
    scroll = false,
    customPath?: string,
    replaceHistory = false,
  ): void => {
    argArray.forEach((obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (key && value !== undefined) {
          params[key] = value.toString();
        }
      });
    });

    let searchParamsString = "";
    Object.entries(params)?.map((pair) => {
      const [key, value] = pair;
      const text = `${key}=${value}&`;
      searchParamsString += text;
    });

    if (replaceHistory) {
      router.replace(`${customPath || path}?${getSearchParamsString()}`, {
        scroll,
      });
    } else {
      router.push(`${customPath || path}?${getSearchParamsString()}`, {
        scroll,
      });
    }
  };

  const setSearchParamShallow = (argArray: InputType[]): void => {
    argArray.forEach((obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        params[key] = value.toString();
      });
    });

    let searchParamsString = "";
    Object.entries(params)?.map((pair) => {
      const [key, value] = pair;
      const text = `${key}=${value}&`;
      searchParamsString += text;
    });

    window.history.replaceState(
      null,
      "",
      `${defaultPath || path}?${getSearchParamsString()}`,
    );
  };

  const removeQuey = (queryKey: string) => {
    const updatedParams = { ...params };

    if (params[queryKey]) {
      // If queryKey exists, delete it
      delete updatedParams[queryKey];

      // When closing the chat, we replace the current state
      window.history.replaceState(
        null,
        "",
        `${defaultPath || path}?${new URLSearchParams(updatedParams).toString()}`,
      );
    }
  };

  const addQuey = (queryKey: string, value: string = "true") => {
    const updatedParams = { ...params };

    // If queryKey does not exist, add it
    updatedParams[queryKey] = value;

    // When opening the modal, we push a new state
    window.history.pushState(
      null,
      "",
      `${defaultPath || path}?${new URLSearchParams(updatedParams).toString()}`,
    );
  };

  const toggleHistoryShallow = (queryKey: string, value: string = "true") => {
    const updatedParams = { ...params };

    if (params[queryKey]) {
      // If queryKey exists, delete it
      delete updatedParams[queryKey];

      // When closing the chat, we replace the current state
      window.history.replaceState(
        null,
        "",
        `${defaultPath || path}?${new URLSearchParams(updatedParams).toString()}`,
      );
    } else {
      // If queryKey does not exist, add it
      updatedParams[queryKey] = value;

      // When opening the chat, we push a new state
      window.history.pushState(
        null,
        "",
        `${defaultPath || path}?${new URLSearchParams(updatedParams).toString()}`,
      );
    }
  };

  const debouncedSetSearchParam = useCallback(
    useDebouncedCallback((argArray: InputType[]) => {
      setSearchParam(argArray);
    }, 500),
    [setSearchParam],
  );

  // ---------------------------
  // 🔹 HASH PARAM SUPPORT
  // ---------------------------
  const hashParams = useMemo(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash.replace(/^#/, "");
    const result: Record<string, string> = {};
    if (hash) {
      hash.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key) result[key] = value || "";
      });
    }
    return result;
  }, [typeof window !== "undefined" ? window.location.hash : ""]);

  const { isSmall } = useSizeController();

  const setHashParams = (
    argArray: InputType[],
    options?: { noDesktopHistory?: boolean; noMobileHistory?: boolean },
  ): void => {
    const updated = { ...hashParams };

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
      // Replace current URL without adding history
      history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${newHash}`,
      );
    } else {
      // Default behavior: add to history
      window.location.hash = newHash;
    }
  };

  const deleteHashParams = (keys: string[]): void => {
    const updated = { ...hashParams };
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
  };

  return {
    setSearchParamShallow,
    setSearchParam,
    debouncedSetSearchParam,
    params,
    getSearchParamsString,
    toggleHistoryShallow,
    addQuey,
    removeQuey,
    mainParams,

    // new exports
    hashParams,
    setHashParams,
    deleteHashParams,
  };
};

export default useSetSearchParams;
