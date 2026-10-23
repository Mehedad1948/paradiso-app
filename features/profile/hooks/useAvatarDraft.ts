"use client";
import { useEffect, useState } from "react";
import { panelApi } from "@/lib/api/panel";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/types/user";

/**
 * A local avatar edit. Nothing is uploaded until `commit`, so abandoned picks leave no files.
 * `commit` resolves to the PATCH value: a new URL, null to remove, or undefined when unchanged.
 */
export function useAvatarDraft(saved: string | null | undefined) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return {
    src: preview ?? (removed ? undefined : saved ?? undefined),
    error,
    dirty: !!file || (removed && !!saved),
    choose(next: File | undefined) {
      if (!next) return;
      if (!AVATAR_TYPES.includes(next.type))
        return setError("Choose a JPEG, PNG or WebP image.");
      if (next.size > AVATAR_MAX_BYTES)
        return setError("Choose an image up to 2 MB.");
      setError(null);
      setFile(next);
      setRemoved(false);
      setPreview(URL.createObjectURL(next));
    },
    remove() {
      setError(null);
      setFile(null);
      setPreview(null);
      setRemoved(true);
    },
    reset() {
      setError(null);
      setFile(null);
      setPreview(null);
      setRemoved(false);
    },
    async commit(): Promise<string | null | undefined> {
      if (file) return (await panelApi.uploadImage({ file, folder: "avatars" })).path;
      if (removed && saved) return null;
    },
  };
}

export type AvatarDraft = ReturnType<typeof useAvatarDraft>;
