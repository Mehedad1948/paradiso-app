"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import CircularCarousel, {
  type CircularCarouselItem,
} from "@/components/ui/CircularCarousel";
import { postHref } from "@/features/community/format";

export type ShowcaseItem = CircularCarouselItem & { postId: number };

// The ring is scaled down to fit its box, so on a phone the box is made wider than the
// screen (the frame clips it) and the ring keeps its full size.
const MOBILE_QUERY = "(max-width: 639px)";
const MOBILE_CARD_WIDTH = 280;
const MOBILE_CARDS = 6;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function ShowcaseCarousel({ items }: { items: ShowcaseItem[] }) {
  const router = useRouter();
  const mobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
  const shown = mobile ? items.slice(0, MOBILE_CARDS) : items;
  return (
    <CircularCarousel
      items={shown}
      preset="cylinder"
      cardWidth={mobile ? MOBILE_CARD_WIDTH : 320}
      aspectRatio={2 / 3}
      tilt={-9}
      speed={8}
      fadeColor="hsl(var(--heroui-background))"
      overlay
      className="h-full w-full max-sm:ml-[calc(50%-550px)] max-sm:w-[1100px]"
      onItemClick={(_, index) => router.push(postHref(shown[index].postId))}
    />
  );
}
