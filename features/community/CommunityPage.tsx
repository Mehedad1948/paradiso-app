"use client";
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { ArrowUpRight, Film, Megaphone, PenLine, Star, Users, X } from "lucide-react";
import TintedAvatar from "./components/TintedAvatar";
import { useProfile } from "@/hooks/queries/useCommunityQueries";
import type { FeedScope } from "@/types/community";
import { useViewer, type Viewer } from "./hooks/useViewer";
import { useHeld } from "./hooks/useHeld";
import FeedList from "./components/FeedList";
import SignInLink from "./components/SignInLink";
import { plural, profileHref } from "./format";

const PostComposer = dynamic(() => import("./components/PostComposer"), { ssr: false });

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Tab = "everyone" | "following";

export default function CommunityPage() {
  const router = useRouter();
  const pathname = usePathname();
  // While a post is open over the feed the URL is the post's; keep reading the feed's own query.
  const query = useHeld(useSearchParams().toString(), pathname === "/community");
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const viewer = useViewer();
  const [composing, setComposing] = useState(false);

  const movieParam = params.get("movie");
  const movieId = movieParam && uuid.test(movieParam) ? movieParam : undefined;
  const movieTitle = params.get("title")?.slice(0, 200) || "this film";
  // Hold the Following tab while the session loads, rather than flashing the global feed.
  const wantsFollowing = !movieId && params.get("tab") === "following";
  const tab: Tab = wantsFollowing && (viewer.signedIn || viewer.checking) ? "following" : "everyone";
  const scope: FeedScope = tab === "following" ? { kind: "following" } : { kind: "global", movieId };

  const navigate = useCallback(
    (next: Record<string, string | null>) => {
      const search = new URLSearchParams(query);
      Object.entries(next).forEach(([key, value]) => (value ? search.set(key, value) : search.delete(key)));
      router.replace(`/community${search.size ? `?${search}` : ""}`, { scroll: false });
    },
    [query, router],
  );

  return (
    <div>
      <h1 className="sr-only">Community</h1>
      <div className="-mt-6 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Recommendations" className="min-w-0">
          <div className="sticky top-[88px] z-30 -mx-1 mb-5 bg-canvas/95 px-1 pt-1 backdrop-blur-md max-md:top-20 max-[480px]:static">
            {movieId ? (
              <div className="flex items-center justify-between gap-4 border-b border-line pb-3.5">
                <p className="min-w-0 text-[15px]">
                  <span className="block text-sm font-semibold uppercase tracking-[0.09em] text-muted">Recommendations for</span>
                  <span className="block truncate text-xl font-semibold tracking-[-0.03em]">{movieTitle}</span>
                </p>
                <Link
                  href="/community"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-muted"
                >
                  <X size={15} aria-hidden="true" /> Clear
                </Link>
              </div>
            ) : (
              <FeedTabs
                tab={tab}
                signedIn={viewer.signedIn}
                onChange={(next) => navigate({ tab: next === "following" ? "following" : null })}
              />
            )}
          </div>

          <FeedList
            key={JSON.stringify(scope)}
            scope={scope}
            viewer={viewer}
            enabled={!(tab === "following" && !viewer.signedIn)}
            empty={<EmptyFeed tab={tab} movie={movieId ? movieTitle : undefined} onCompose={() => setComposing(true)} viewer={viewer} />}
          />
        </section>

        <aside className="sticky top-[112px] flex flex-col gap-5 max-lg:hidden">
          {viewer.signedIn ? (
            <Button
              className="min-h-[50px] rounded-full bg-accent text-base font-semibold text-on-accent shadow-[0_10px_30px_hsl(var(--heroui-primary-500)/0.35)]"
              startContent={<PenLine size={18} aria-hidden="true" />}
              onPress={() => setComposing(true)}
            >
              Recommend a film
            </Button>
          ) : (
            !viewer.checking && <SignInLink className="min-h-[50px] !rounded-full">Sign in to post</SignInLink>
          )}
          {viewer.me && <ViewerCard viewer={viewer} />}
        </aside>
      </div>

      {viewer.signedIn && (
        <Button
          isIconOnly
          aria-label="Recommend a film"
          onPress={() => setComposing(true)}
          className="fixed bottom-6 right-5 z-40 h-14 w-14 rounded-full bg-accent text-on-accent shadow-[0_12px_32px_rgb(0_0_0_/_28%)] lg:hidden"
        >
          <PenLine size={22} />
        </Button>
      )}
      {composing && <PostComposer onClose={() => setComposing(false)} />}
    </div>
  );
}

function FeedTabs({ tab, signedIn, onChange }: { tab: Tab; signedIn: boolean; onChange: (tab: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "everyone", label: "Everyone" },
    { key: "following", label: "Following" },
  ];
  return (
    <div role="tablist" aria-label="Feed" className="flex border-b border-line">
      {tabs.map((item) => {
        const selected = tab === item.key;
        const locked = item.key === "following" && !signedIn;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={locked}
            title={locked ? "Sign in to see people you follow" : undefined}
            onClick={() => onChange(item.key)}
            className={clsx(
              "relative flex-1 py-3.5 text-[15px] font-semibold transition-colors sm:flex-none sm:px-8",
              selected ? "text-ink" : "text-muted hover:text-ink",
              locked && "cursor-not-allowed opacity-50 hover:text-muted",
            )}
          >
            {item.label}
            <span
              aria-hidden="true"
              className={clsx(
                "absolute inset-x-4 -bottom-px h-[3px] rounded-full bg-accent transition-transform duration-300 ease-out sm:inset-x-6",
                selected ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function EmptyFeed({
  tab,
  movie,
  viewer,
  onCompose,
}: {
  tab: Tab;
  movie?: string;
  viewer: Viewer;
  onCompose: () => void;
}) {
  const [title, body] = movie
    ? [`No one has recommended ${movie} yet`, "Seen it? Your take could be the first."]
    : tab === "following"
      ? ["Your following feed is quiet", "Follow people from the Everyone tab and their recommendations land here."]
      : ["The screen is still dark", "Be the first to recommend a film to the community."];
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center gap-3">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-accent">
        <Film size={24} aria-hidden="true" />
      </span>
      <p className="text-lg font-semibold tracking-[-0.02em]">{title}</p>
      <p className="text-[15px] text-muted">{body}</p>
      {viewer.signedIn && tab === "everyone" && (
        <Button onPress={onCompose} className="mt-2 rounded-md bg-ink font-semibold text-canvas">
          Recommend a film
        </Button>
      )}
    </div>
  );
}

function ViewerCard({ viewer }: { viewer: Viewer }) {
  const me = viewer.me!;
  const profile = useProfile(me.id);
  return (
    <div className="rounded-[10px] border border-line bg-elevated p-5">
      <div className="flex items-center gap-3">
        <TintedAvatar user={viewer.self!} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{me.username}</p>
          <p className="text-sm text-muted">
            {profile.data
              ? `${plural(profile.data.followersCount, "follower")} · ${profile.data.followingCount.toLocaleString()} following`
              : " "}
          </p>
        </div>
      </div>
      <Link
        href={profileHref(me.id)}
        className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-md border border-line bg-surface text-[15px] font-semibold transition-opacity hover:opacity-80"
      >
        Your profile <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

function GuideCard() {
  const steps = [
    { icon: Star, title: "Rate it out of ten", body: "Your own score, to one decimal. Room votes stay separate." },
    { icon: PenLine, title: "Say why", body: "A few honest lines beat a plot summary. Warn before spoilers." },
    { icon: Users, title: "Keep it close", body: "Post to a room and only its members see it." },
    { icon: Megaphone, title: "Promote your room", body: "Own a room? Attach an invite so readers can join." },
  ];
  return (
    <div className="rounded-[10px] border border-line bg-surface/60 p-5">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.09em] text-accent">House rules</p>
      <ol className="flex flex-col gap-4">
        {steps.map(({ icon: Icon, title, body }) => (
          <li key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3">
            <Icon size={18} className="mt-0.5 text-muted" aria-hidden="true" />
            <div>
              <p className="text-[15px] font-semibold leading-snug">{title}</p>
              <p className="text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
