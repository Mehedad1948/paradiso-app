"use client";

import { ArrowUpRight, Plus } from "lucide-react";

export default function CreateRoomCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button type="button" onClick={onCreate} className="flex h-full min-h-[280px] w-full cursor-pointer flex-col items-start justify-center gap-4 rounded-[10px] border border-dashed border-line bg-surface p-7 text-left transition-colors hover:border-accent hover:bg-elevated [&>svg]:text-accent [&>strong]:text-2xl [&>strong]:leading-[1.15] [&>strong]:tracking-[-0.04em] [&>span]:max-w-60 [&>span]:text-[15px] [&>span]:text-muted max-sm:min-h-[220px] motion-reduce:transition-none">
      <Plus size={34} strokeWidth={1.5} aria-hidden="true" />
      <strong>A room of your own.</strong>
      <span>Bring your favorite people and your next great watchlist.</span>
      <ArrowUpRight size={22} aria-hidden="true" />
    </button>
  );
}
