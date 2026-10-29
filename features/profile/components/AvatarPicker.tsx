"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@heroui/button";
import { GalleryAddIcon } from "@solar-icons/react/linear";
import { AVATAR_TYPES } from "@/types/user";
import UserAvatar from "@/components/ui/UserAvatar";
import type { AvatarDraft } from "../hooks/useAvatarDraft";
import type { AvatarConfig } from "../lib/avatar-builder";

// ssr: false gives it its own Suspense boundary, so loading it doesn't blank the sidebar.
const AvatarEditor = dynamic(() => import("./AvatarEditor"), { ssr: false });
// The builder (and the DiceBear style behind it) is only fetched once someone opens it.
const loadBuilder = () => import("./AvatarBuilder");
const AvatarBuilder = dynamic(loadBuilder, { ssr: false });
const preloadBuilder = () => void loadBuilder();
/** Originals are only decoded in the browser; the edited upload is far smaller. */
const SOURCE_MAX_BYTES = 20 * 1024 * 1024;

export default function AvatarPicker({
  draft,
  name,
  disabled,
}: {
  draft: AvatarDraft;
  name: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  // `editing` is the original open in the editor; `original` is the one behind the applied edit,
  // kept so that edit can be revisited.
  const [editing, setEditing] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // `designing` opens the builder; `design` remembers the last look so it reopens where it left off.
  const [designing, setDesigning] = useState(false);
  const [design, setDesign] = useState<AvatarConfig | null>(null);
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const release = (url: string | null, keep?: string | null) => {
    if (!url || url === keep) return;
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  };

  const pick = () => input.current?.click();
  function open(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return setError("Choose a JPEG, PNG or WebP image.");
    if (file.size > SOURCE_MAX_BYTES) return setError("Choose an image up to 20 MB.");
    setError(null);
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    setEditing(url);
  }
  function cancel() {
    release(editing, original);
    setEditing(null);
  }
  function apply(file: File) {
    release(original, editing);
    setOriginal(editing);
    setEditing(null);
    draft.choose(file);
  }
  const source = draft.dirty ? original : null;

  const message = error ?? draft.error;
  return (
    <section aria-labelledby="avatar-label" className="flex flex-col gap-2">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={pick}
          disabled={disabled}
          className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-elevated"
          aria-label={draft.src ? "Change profile photo" : "Add profile photo"}
        >
          <UserAvatar src={draft.src} name={name} size="xl" className="border border-line" />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <GalleryAddIcon size={22} aria-hidden="true" />
          </span>
        </button>
        <div className="min-w-0">
          <h2 id="avatar-label" className="text-base font-semibold">
            Profile photo
          </h2>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button size="sm" variant="bordered" className="border-line" onPress={pick} isDisabled={disabled}>
              {draft.src ? "Change" : "Upload"}
            </Button>
            <Button
              size="sm"
              variant="bordered"
              className="border-line"
              startContent={
                // A static, pre-rendered illustration: no DiceBear code runs until the builder opens.
                <img
                  src="/avatar-design.svg"
                  alt=""
                  width={22}
                  height={22}
                  decoding="async"
                  className="size-[22px] rounded-full"
                />
              }
              onPress={() => setDesigning(true)}
              // Start fetching the builder chunk before the click lands.
              onMouseEnter={preloadBuilder}
              onFocus={preloadBuilder}
              isDisabled={disabled}
            >
              Create
            </Button>
            {source && draft.src && (
              <Button size="sm" variant="light" onPress={() => setEditing(source)} isDisabled={disabled}>
                Edit
              </Button>
            )}
            {draft.src && (
              <Button
                size="sm"
                variant="light"
                className="text-muted"
                isDisabled={disabled}
                onPress={() => {
                  draft.remove();
                  release(original);
                  setOriginal(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => open(event.target.files?.[0])}
        />
      </div>
      {message && (
        <p role="alert" className="text-sm text-danger-500">
          {message}
        </p>
      )}
      {editing && <AvatarEditor source={editing} onCancel={cancel} onApply={apply} />}
      {designing && (
        <AvatarBuilder
          initial={design}
          onCancel={() => setDesigning(false)}
          onApply={(file, config) => {
            // A drawn avatar has no photo behind it, so there is nothing to re-edit.
            release(original);
            setOriginal(null);
            setDesign(config);
            setDesigning(false);
            draft.choose(file);
          }}
        />
      )}
    </section>
  );
}
