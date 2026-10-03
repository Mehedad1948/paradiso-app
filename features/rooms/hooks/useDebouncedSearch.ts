"use client";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
export function useDebouncedSearch(
  value: string,
  onCommit: (value: string) => void,
) {
  const [draft, setDraft] = useState(value);
  const commit = useDebouncedCallback(onCommit, 400);
  useEffect(() => {
    setDraft(value);
    commit.cancel();
    return () => commit.cancel();
  }, [value, commit]);
  function change(next: string) {
    setDraft(next);
    if (!next) {
      commit.cancel();
      onCommit("");
    } else commit(next);
  }
  return { draft, change };
}
