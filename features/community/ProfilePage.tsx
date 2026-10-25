"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";
import { ArrowLeft, Film, PenLine } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import UserAvatar from "@/components/ui/UserAvatar";
import { BffError } from "@/lib/api/client";
import { useProfile } from "@/hooks/queries/useCommunityQueries";
import { useViewer } from "./hooks/useViewer";
import { useHeld } from "./hooks/useHeld";
import FeedList from "./components/FeedList";
import FollowButton from "./components/FollowButton";

const PostComposer = dynamic(() => import("./components/PostComposer"), { ssr: false });
const PeopleSidebar = dynamic(() => import("./components/PeopleSidebar"), { ssr: false });

export default function ProfileRoute() {
  // Holds the profile underneath a post opened over it, whose URL carries no userId.
  const { userId: live } = useParams<{ userId?: string }>();
  const userId = useHeld(live, !!live);
  return <ProfilePage key={userId} userId={Number(userId)} />;
}

function Count({ value, label, onPress }: { value?: number; label: string; onPress: () => void }) {
  return (
    <button type="button" onClick={onPress} className="group text-[15px] text-muted transition-colors hover:text-ink">
      <span className="font-semibold tabular-nums text-ink">{value === undefined ? "–" : value.toLocaleString()}</span>{" "}
      <span className="group-hover:underline">{label}</span>
    </button>
  );
}

function ProfilePage({ userId }: { userId: number }) {
  const viewer = useViewer();
  const profile = useProfile(userId);
  const [people, setPeople] = useState<"followers" | "following" | null>(null);
  const [composing, setComposing] = useState(false);
  const self = viewer.me?.id === userId;
  const missing =
    !Number.isSafeInteger(userId) ||
    (profile.error instanceof BffError && (profile.error.status === 404 || profile.error.status === 400));
  const name = profile.data?.username;

  return (
    <div className="mx-auto max-w-[860px]">
      <Link href="/community" className="mb-6 inline-flex items-center gap-2 text-[15px] text-muted hover:text-accent">
        <ArrowLeft size={18} aria-hidden="true" /> Community
      </Link>

      {missing ? (
        <div className="rounded-[10px] border border-line bg-elevated px-6 py-16 text-center">
          <h1 className="text-2xl">No one by that name</h1>
          <p className="mt-2 text-[15px] text-muted">This profile doesn&apos;t exist, or it was removed.</p>
        </div>
      ) : profile.isError && !profile.data ? (
        <QueryError error={profile.error} retry={() => profile.refetch()} />
      ) : (
        <>
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-9 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:pb-7">
            <div className="flex min-w-0 items-center gap-6 max-sm:gap-4">
              {profile.data ? (
                <UserAvatar name={profile.data.username} src={profile.data.avatar} size="xl" className="shrink-0" />
              ) : (
                <span className="h-[88px] w-[88px] shrink-0 rounded-full bg-surface motion-safe:animate-pulse" />
              )}
              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.09em] text-accent">
                  {self ? "Your film diary" : "Film diary"}
                </p>
                <h1 className="truncate text-[clamp(32px,4vw,54px)] tracking-[-0.06em]">
                  {name ?? <span className="inline-block h-10 w-48 rounded bg-surface align-middle motion-safe:animate-pulse" />}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                  <Count value={profile.data?.followersCount} label={profile.data?.followersCount === 1 ? "follower" : "followers"} onPress={() => setPeople("followers")} />
                  <Count value={profile.data?.followingCount} label="following" onPress={() => setPeople("following")} />
                </div>
              </div>
            </div>
            <div className="shrink-0 max-sm:w-full max-sm:[&>*]:w-full">
              {self ? (
                <Button
                  className="min-h-[46px] rounded-md bg-ink text-[15px] font-semibold text-canvas"
                  startContent={<PenLine size={18} aria-hidden="true" />}
                  onPress={() => setComposing(true)}
                >
                  New post
                </Button>
              ) : (
                <FollowButton userId={userId} viewer={viewer} />
              )}
            </div>
          </div>

          <h2 className="mb-5 text-[clamp(22px,2vw,28px)]">Recommendations</h2>
          <FeedList
            scope={{ kind: "global", authorId: userId }}
            viewer={viewer}
            empty={
              <div className="mx-auto flex max-w-[340px] flex-col items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-accent">
                  <Film size={24} aria-hidden="true" />
                </span>
                <p className="text-lg font-semibold">{self ? "Your diary is empty" : "Nothing recommended yet"}</p>
                <p className="text-[15px] text-muted">
                  {self
                    ? "Share the last film that stayed with you."
                    : `When ${name ?? "they"} recommends a film, it shows up here.`}
                </p>
              </div>
            }
          />
        </>
      )}

      {people && profile.data && (
        <PeopleSidebar
          userId={userId}
          username={profile.data.username}
          kind={people}
          viewer={viewer}
          onClose={() => setPeople(null)}
        />
      )}
      {composing && <PostComposer onClose={() => setComposing(false)} />}
    </div>
  );
}
