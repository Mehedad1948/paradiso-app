"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { SearchIcon, Plus, UserPlus } from "lucide-react";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
export default function RoomToolbar({
  search,
  onSearch,
  onAddMovie,
  onInvite,
  disabled,
}: {
  search: string;
  onSearch: (search: string) => void;
  onAddMovie: () => void;
  onInvite: () => void;
  disabled: boolean;
}) {
  const { draft, change } = useDebouncedSearch(search, onSearch);
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4 max-sm:[&>div]:w-full max-sm:[&>div>button]:flex-1">
      <Input
        className="w-full sm:w-80"
        classNames={{ inputWrapper: "border border-line bg-surface shadow-none", input: "text-base" }}
        aria-label="Search movies"
        placeholder="Search movies..."
        value={draft}
        onValueChange={change}
        isClearable
        onClear={() => change("")}
        startContent={<SearchIcon className="text-default-400" size={20} />}
      />
      <div className="flex items-center gap-3">
        <Button
          className="min-h-[46px] rounded-md border border-line bg-surface text-[15px] font-semibold text-ink"
          startContent={<UserPlus size={18} aria-hidden="true" />}
          isDisabled={disabled}
          onPress={onInvite}
        >
          Invite people
        </Button>
        <Button
          className="min-h-[46px] rounded-md bg-ink text-[15px] font-semibold text-canvas"
          startContent={<Plus size={18} aria-hidden="true" />}
          isDisabled={disabled}
          onPress={onAddMovie}
        >
          Add a film
        </Button>
      </div>
    </div>
  );
}
