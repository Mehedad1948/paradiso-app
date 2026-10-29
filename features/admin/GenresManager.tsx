"use client";
import { useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { RefreshIcon } from "@solar-icons/react/linear";
import QueryError from "@/components/ui/QueryError";
import { useGenres } from "@/hooks/queries/useMe";
import { useRemoveGenre, useRenameGenre, useSyncGenres } from "@/hooks/queries/useAdminQueries";
import type { Genre } from "@/types/user";
import { PageTitle, Panel } from "./shared";

export default function GenresManager() {
  const genres = useGenres();
  const sync = useSyncGenres({
    onSuccess: () => addToast({ title: "Genres synced from TMDb", color: "success" }),
  });

  return (
    <>
      <PageTitle title="Genres">
        The genres members choose from. Syncing pulls TMDb’s list in; renaming changes the label only.
      </PageTitle>
      <Panel
        title={genres.data ? `${genres.data.length} genres` : "Genres"}
        hint={
          <Button
            size="md"
            variant="flat"
            isLoading={sync.isPending}
            startContent={sync.isPending ? null : <RefreshIcon size={14} />}
            onPress={() => sync.execute(undefined)}
          >
            Sync from TMDb
          </Button>
        }
      >
        {genres.isPending ? <Spinner className="p-6" aria-label="Loading genres" /> : null}
        {genres.error ? <QueryError error={genres.error} retry={() => genres.refetch()} /> : null}
        <ul className="grid gap-2 md:grid-cols-2">
          {genres.data?.map((genre) => <GenreRow key={`${genre.id}-${genre.name}`} genre={genre} />)}
        </ul>
      </Panel>
    </>
  );
}

function GenreRow({ genre }: { genre: Genre }) {
  const [name, setName] = useState(genre.name);
  const [confirm, setConfirm] = useState(false);
  const rename = useRenameGenre({
    onSuccess: () => addToast({ title: "Renamed", color: "success" }),
    onError: (error) => {
      setName(genre.name);
      addToast({ title: error.message, color: "danger" });
    },
  });
  const remove = useRemoveGenre({ onSuccess: () => addToast({ title: `Deleted ${genre.name}`, color: "success" }) });
  const commit = () => {
    const next = name.trim();
    if (!next) setName(genre.name);
    else if (next !== genre.name) rename.execute({ id: genre.id, name: next });
  };
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line bg-surface/40 p-3">
      <Input
        size="md"
        aria-label={`Name of ${genre.name}`}
        value={name}
        onValueChange={setName}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setName(genre.name);
        }}
        maxLength={100}
        isDisabled={rename.isPending}
      />
      <Chip size="md" variant="flat" className="shrink-0">TMDb {genre.tmdbId}</Chip>
      {confirm ? (
        <Button size="md" color="danger" isLoading={remove.isPending} onPress={() => remove.execute(genre.id)} onBlur={() => setConfirm(false)} autoFocus>
          Delete?
        </Button>
      ) : (
        <Button size="md" variant="light" color="danger" onPress={() => setConfirm(true)}>
          Delete
        </Button>
      )}
    </li>
  );
}
