"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { useMe, useUpdateMe } from "@/hooks/queries/useMe";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import AvatarPicker from "@/features/profile/components/AvatarPicker";
import GenrePicker from "@/features/profile/components/GenrePicker";
import { useAvatarDraft } from "@/features/profile/hooks/useAvatarDraft";

export default function OnboardingPage() {
  const router = useRouter();
  const { origin } = useAuthLocation();
  const me = useMe();
  const update = useUpdateMe();
  const user = me.data;
  const avatar = useAvatarDraft(user?.avatar);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"save" | "skip" | null>(null);
  const finished = !!user?.onboardedAt;
  const busy = uploading || update.isPending;

  // Untouched selection falls back to the genres already saved on the account.
  const selected = picked ?? user?.genres.map((genre) => genre.id) ?? [];
  useEffect(() => {
    // Already onboarded (another tab, or a revisit): nothing to do here.
    if (finished && !action) router.replace(origin);
  }, [finished, action, router, origin]);

  async function finish(kind: "save" | "skip") {
    setError(null);
    setAction(kind);
    try {
      let next: string | null | undefined;
      if (kind === "save") {
        setUploading(true);
        next = await avatar.commit();
      }
      await update.mutateAsync(
        kind === "skip"
          ? { onboarded: true }
          : { avatar: next, genreIds: selected, onboarded: true },
      );
      router.replace(origin);
    } catch (cause) {
      setAction(null);
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (me.isPending) return <p role="status">Loading your account…</p>;
  if (!user)
    return <AuthFeedback error="We couldn't load your account. Please refresh the page." />;

  return (
    <div className="flex h-full flex-col justify-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
        Welcome, {user.username}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Make it yours</h1>
      <p className="text-base text-muted">
        Add a photo and the genres you love. Both are optional.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        <AvatarPicker draft={avatar} name={user.username} disabled={busy} />
        <GenrePicker
          selected={selected}
          onChange={(next) => {
            setError(null);
            setPicked(next);
          }}
          disabled={busy}
        />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <AuthFeedback error={error} />
        <Button
          color="secondary"
          onPress={() => void finish("save")}
          isLoading={busy && action === "save"}
          isDisabled={busy}
        >
          Continue
        </Button>
        <Button
          variant="light"
          className="text-muted"
          onPress={() => void finish("skip")}
          isLoading={busy && action === "skip"}
          isDisabled={busy}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
