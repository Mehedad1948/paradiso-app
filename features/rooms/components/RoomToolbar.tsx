"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { SearchIcon } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-3 mb-4 justify-between">
      <Input
        className="w-full sm:w-72"
        aria-label="Search movies"
        placeholder="Search movies..."
        value={draft}
        onValueChange={change}
        isClearable
        onClear={() => change("")}
        startContent={<SearchIcon className="text-default-400" size={20} />}
      />
      <div className="flex items-center gap-3">
        <Button color="primary" isDisabled={disabled} onPress={onInvite}>
          Invite
        </Button>
        <Button color="secondary" isDisabled={disabled} onPress={onAddMovie}>
          Add Movie
        </Button>
      </div>
    </div>
  );
}
