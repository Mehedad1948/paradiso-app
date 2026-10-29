"use client";
import { useState } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import { Button } from "@heroui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { AddIcon, ChatSquareQuoteIcon, PenIcon } from "@solar-icons/react/linear";
import { normalizeNote } from "@/hooks/queries/useFavoriteQueries";
import type { FavoriteMovie } from "@/types/community";
import { NoteCounter, NoteInput, NoteQuote } from "./FavoriteNote";

/**
 * The quote mark on a favorite's poster. Visitors open it to read the note;
 * the owner can write or rewrite it right there, without opening the editor.
 */
export default function FavoriteNoteChip({
  item,
  name,
  onSave,
}: {
  item: FavoriteMovie;
  /** Whose shelf this is, for visitors. */
  name?: string;
  /** Present only on your own shelf. */
  onSave?: (note: string | null) => void;
}) {
  const { note, movie } = item;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!note && !onSave) return null;

  const start = () => {
    setDraft(note ?? "");
    setEditing(true);
  };
  const toggle = (value: boolean) => {
    setOpen(value);
    if (value && !note) start();
    if (!value) setEditing(false);
  };
  const submit = () => {
    if (normalizeNote(draft) !== note) onSave?.(normalizeNote(draft));
    toggle(false);
  };

  return (
    <Popover
      isOpen={open}
      onOpenChange={toggle}
      placement="bottom-end"
      offset={8}
      shouldBlockScroll={false}
      classNames={{
        content:
          "w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-[20px] border border-line bg-elevated p-0 text-ink shadow-[0_24px_70px_-12px_rgb(0_0_0_/_32%)]",
      }}
    >
      <PopoverTrigger>
        <button
          type="button"
          aria-label={
            note ? `Read the note on ${movie.title}` : `Add a note to ${movie.title}`
          }
          className={clsx(
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-white ring-1 ring-white/20 backdrop-blur-md transition-[background-color,transform,opacity] duration-200 hover:scale-110 sm:h-8 sm:w-8",
            note ? "bg-accent/85 hover:bg-accent" : "bg-black/45 hover:bg-black/60",
            // An empty chip only appears when you reach for the poster.
            !note && !open && "opacity-0 focus-visible:opacity-100 group-hover/tile:opacity-100 max-sm:hidden",
          )}
        >
          {note ? <ChatSquareQuoteIcon size={15} aria-hidden="true" /> : <AddIcon size={16} aria-hidden="true" />}
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label={`Note on ${movie.title}`}>
        {open && (
          <div className="w-full p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.01em]">{movie.title}</p>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-accent">#{item.position}</span>
            </div>

            {editing ? (
              <>
                <NoteInput
                  autoFocus
                  title={movie.title}
                  value={draft}
                  onChange={setDraft}
                  onSubmit={submit}
                  onCancel={() => (note ? setEditing(false) : toggle(false))}
                  className="mt-3"
                />
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <NoteCounter length={draft.length} />
                  <div className="flex gap-1.5">
                    {note && (
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => {
                          onSave?.(null);
                          toggle(false);
                        }}
                        className="rounded-md font-semibold text-muted data-[hover=true]:text-danger"
                      >
                        Remove
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onPress={submit}
                      isDisabled={normalizeNote(draft) === note}
                      className="rounded-md bg-ink font-semibold text-canvas"
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted">Public · ⌘/Ctrl + Enter to save</p>
              </>
            ) : (
              <>
                <NoteQuote note={note!} className="mt-3 text-[15px] leading-relaxed text-ink/90" />
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="text-xs text-muted">
                    {onSave ? "On your shelf" : name ? `On ${name}'s shelf` : "On their shelf"} since{" "}
                    {format(new Date(item.addedAt), "MMM yyyy")}
                  </span>
                  {onSave && (
                    <button
                      type="button"
                      onClick={start}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                      <PenIcon size={13} aria-hidden="true" /> Edit
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
