"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { LockIcon, MentionCircleIcon } from "@solar-icons/react/linear";
import { useUpdateMe } from "@/hooks/queries/useMe";
import type { CurrentUser, UpdateMeInputs } from "@/types/user";
import { useAvatarDraft } from "../hooks/useAvatarDraft";
import { SETTINGS_SECTIONS } from "../sections";
import AvatarPicker from "./AvatarPicker";
import GenrePicker from "./GenrePicker";
import InvitePolicyPicker from "./InvitePolicyPicker";
import SaveBar from "./SaveBar";
import SentInvitations from "./SentInvitations";
import SettingsSection from "./SettingsSection";

const FORM_ID = "profile-settings";
const icon = (id: string) => SETTINGS_SECTIONS.find((section) => section.id === id)!.icon;
const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

/** Profile, taste and privacy: one draft, saved together from the floating save bar. */
export default function ProfileSettings({ user }: { user: CurrentUser }) {
  const update = useUpdateMe();
  const form = useRef<HTMLFormElement>(null);
  const avatar = useAvatarDraft(user.avatar);
  const savedGenres = user.genres.map((genre) => genre.id);
  const savedPolicy = user.roomInvitePolicy ?? "everyone";
  const [username, setUsername] = useState(user.username);
  const [genres, setGenres] = useState(savedGenres);
  const [policy, setPolicy] = useState(savedPolicy);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = uploading || update.isPending;
  const name = username.trim();
  const dirty =
    name !== user.username ||
    avatar.dirty ||
    !sameSet(genres, savedGenres) ||
    policy !== savedPolicy;
  const canSave = dirty && !!name && !busy;

  // Warn before a reload or tab close would throw the draft away.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "s" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (canSave) form.current?.requestSubmit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSave]);

  function reset(to: CurrentUser) {
    setUsername(to.username);
    setGenres(to.genres.map((genre) => genre.id));
    setPolicy(to.roomInvitePolicy ?? "everyone");
    avatar.reset();
    setError(null);
  }

  const edit =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setError(null);
    };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    setError(null);
    try {
      const changes: UpdateMeInputs = {};
      if (name !== user.username) changes.username = name;
      if (!sameSet(genres, savedGenres)) changes.genreIds = genres;
      if (policy !== savedPolicy) changes.roomInvitePolicy = policy;
      if (avatar.dirty) {
        setUploading(true);
        changes.avatar = await avatar.commit();
      }
      reset(await update.mutateAsync(changes));
      addToast({ title: "Profile updated", color: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form ref={form} id={FORM_ID} onSubmit={save} className="flex flex-col gap-8">
      <SettingsSection
        id="profile"
        icon={icon("profile")}
        title="Profile"
        description="How you appear in rooms, posts and the community."
      >
        <div className="flex flex-col gap-8">
          <AvatarPicker draft={avatar} name={name || user.username} disabled={busy} />
          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Username"
              labelPlacement="outside"
              placeholder=" "
              autoComplete="username"
              value={username}
              onValueChange={edit(setUsername)}
              maxLength={100}
              isRequired
              isDisabled={busy}
              isInvalid={!name}
              errorMessage="Username is required"
              startContent={<MentionCircleIcon size={16} className="shrink-0 text-muted" aria-hidden="true" />}
            />
            <Input
              label="Email"
              labelPlacement="outside"
              value={user.email}
              isReadOnly
              description="Your sign-in email can't be changed."
              classNames={{ input: "text-muted" }}
              endContent={<LockIcon size={15} className="shrink-0 text-muted" aria-hidden="true" />}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        id="taste"
        icon={icon("taste")}
        title="Favorite genres"
        description="We use these to suggest films and people you'll click with."
      >
        <GenrePicker selected={genres} onChange={edit(setGenres)} disabled={busy} labelledBy="taste-title" />
      </SettingsSection>

      <SettingsSection
        id="privacy"
        icon={icon("privacy")}
        title="Room invitations"
        description="Choose who can pull you into a screening room, and follow the invitations you've sent."
      >
        <InvitePolicyPicker value={policy} onChange={edit(setPolicy)} disabled={busy} labelledBy="privacy-title" />
        <SentInvitations />
      </SettingsSection>

      {error && (
        <p role="alert" className="rounded-2xl border border-danger-500/30 bg-danger-500/10 px-5 py-3 text-sm text-danger-500">
          {error}
        </p>
      )}

      <SaveBar
        visible={dirty || busy}
        formId={FORM_ID}
        saving={busy}
        canSave={canSave}
        onDiscard={() => reset(user)}
      />
    </form>
  );
}
