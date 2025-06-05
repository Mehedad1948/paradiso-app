import { useDebouncedCallback } from "use-debounce";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback } from "react";

const useSetSearchParams = (defaultPath?: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entries = searchParams.entries();
  const mainParams: {
    [key: string]: string;
  } = useParams();

  const path = usePathname();

  const params: { [key: string]: string } = {};

  for (const pair of Array.from(entries)) {
    const [key, value] = pair;
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
    replaceHistory = true,
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
  };
};

export default useSetSearchParams;
