"use client";
import { useEffect, useState } from "react";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useUpdateMe } from "@/hooks/queries/useMe";
import type { CurrentUser, UpdateMeInputs } from "@/types/user";
import { useAvatarDraft } from "../hooks/useAvatarDraft";
import AvatarPicker from "./AvatarPicker";
import GenrePicker from "./GenrePicker";

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

export default function ProfileForm({
  id,
  user,
  onBusyChange,
  onReadyChange,
  onSaved,
}: {
  id: string;
  user: CurrentUser;
  onBusyChange: (busy: boolean) => void;
  onReadyChange: (ready: boolean) => void;
  onSaved: () => void;
}) {
  const update = useUpdateMe();
  const avatar = useAvatarDraft(user.avatar);
  const savedGenres = user.genres.map((genre) => genre.id);
  const [username, setUsername] = useState(user.username);
  const [genres, setGenres] = useState(savedGenres);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = uploading || update.isPending;
  const name = username.trim();
  const dirty =
    name !== user.username || avatar.dirty || !sameSet(genres, savedGenres);

  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  useEffect(() => onReadyChange(dirty && !!name && !busy), [dirty, name, busy, onReadyChange]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || !name || busy) return;
    setError(null);
    try {
      const changes: UpdateMeInputs = {};
      if (name !== user.username) changes.username = name;
      if (!sameSet(genres, savedGenres)) changes.genreIds = genres;
      if (avatar.dirty) {
        setUploading(true);
        changes.avatar = await avatar.commit();
      }
      await update.mutateAsync(changes);
      addToast({ title: "Profile updated", color: "success" });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form id={id} onSubmit={save} className="flex flex-col gap-7 pt-4">
      <AvatarPicker draft={avatar} name={name || user.username} disabled={busy} />
      <div className="flex flex-col gap-5">
        <Input
          label="Username"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="username"
          value={username}
          onValueChange={(value) => {
            setUsername(value);
            setError(null);
          }}
          maxLength={100}
          isRequired
          isDisabled={busy}
          isInvalid={!name}
          errorMessage="Username is required"
        />
        <Input
          label="Email"
          labelPlacement="outside"
          value={user.email}
          isReadOnly
          description="Your sign-in email can't be changed here."
          classNames={{ input: "text-muted" }}
        />
      </div>
      <GenrePicker
        selected={genres}
        onChange={(next) => {
          setGenres(next);
          setError(null);
        }}
        disabled={busy}
      />
      {error && (
        <p role="alert" className="text-sm text-danger-500">
          {error}
        </p>
      )}
    </form>
  );
}
