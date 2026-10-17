"use client";
import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";

export const QUICK_REACTIONS = ["🍿", "❤️", "😂", "😮", "😢", "🔥"];

const GROUPS = [
  { label: "At the movies", emoji: ["🍿", "🎬", "🎥", "📽️", "🎞️", "🎟️", "🎭", "🥤", "🍫", "🌟", "🏆", "📼"] },
  { label: "Reactions", emoji: ["❤️", "😂", "🤣", "😮", "🤯", "😢", "😭", "😍", "🥲", "😱", "😴", "🤔", "🙄", "😬", "🫠", "🥹"] },
  { label: "Verdict", emoji: ["👏", "🙌", "👍", "👎", "🔥", "💯", "✨", "💀", "👀", "🫡", "🤝", "🎉"] },
];

/** Small emoji grid in a popover; `children` is the trigger. */
export default function EmojiPicker({
  onPick,
  children,
  label = "Pick an emoji",
  placement = "top",
}: {
  onPick: (emoji: string) => void;
  children: ReactNode;
  label?: string;
  placement?: "top" | "top-end" | "top-start" | "bottom" | "bottom-end" | "bottom-start";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      placement={placement}
      offset={8}
      classNames={{
        content:
          "rounded-[10px] border border-line bg-elevated p-0 text-ink shadow-[0_18px_50px_rgb(0_0_0_/_18%)]",
      }}
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent aria-label={label}>
        <div className="flex max-h-72 w-[296px] flex-col gap-3 overflow-y-auto p-3">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emoji.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={emoji}
                    onClick={() => {
                      onPick(emoji);
                      setOpen(false);
                    }}
                    className="flex aspect-square items-center justify-center rounded-md text-xl transition-transform hover:scale-110 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
