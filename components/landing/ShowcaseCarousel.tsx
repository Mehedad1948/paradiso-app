"use client";

import { useRouter } from "next/navigation";
import CircularCarousel, {
  type CircularCarouselItem,
} from "@/components/ui/CircularCarousel";
import { postHref } from "@/features/community/format";

export type ShowcaseItem = CircularCarouselItem & { postId: number };

export default function ShowcaseCarousel({ items }: { items: ShowcaseItem[] }) {
  const router = useRouter();
  return (
    <CircularCarousel
      items={items}
      preset="cylinder"
      cardWidth={240}
      aspectRatio={2 / 3}
      fadeColor="hsl(var(--heroui-background))"
      captions
      className="h-full w-full"
      onItemClick={(_, index) => router.push(postHref(items[index].postId))}
    />
  );
}
