"use client";
import { useQuery } from "@tanstack/react-query";
import { panelApi } from "@/lib/api/panel";
import { panelKeys } from "@/lib/query/panel-keys";
export const useMe = () =>
  useQuery({
    queryKey: panelKeys.me,
    queryFn: ({ signal }) => panelApi.me(signal),
    retry: false,
  });
