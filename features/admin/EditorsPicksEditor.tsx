"use client";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { ArrowDown, ArrowUp, ChevronsUp, GripVertical, X } from "lucide-react";
import QueryError from "@/components/ui/QueryError";
import { useAdminEditorsPicks, useSaveEditorsPicks } from "@/hooks/queries/useCurationQueries";
import {
  DAILY_PICKS,
  EDITORS_PICKS_MAX,
  type AdminEditorsPicks,
  type CuratedMovie,
} from "@/types/curations";
import { MoviePicker, PageTitle, Panel, SaveBar, Thumb, imageSrc, useSaveShortcut, useUnsavedGuard, year } from "./shared";

const ids = (films: CuratedMovie[]) => films.map((film) => film.id).join();

export default function EditorsPicksEditor() {
  const query = useAdminEditorsPicks();
  if (query.isPending) return <Spinner className="p-8" aria-label="Loading the picks" />;
  if (query.error || !query.data)
    return <QueryError error={query.error ?? new Error("Could not load the picks.")} retry={() => query.refetch()} />;
  // A fresh save has a new timestamp: the editor restarts from what the server stored.
  return <Editor key={query.data.updatedAt} picks={query.data} />;
}

function Editor({ picks }: { picks: AdminEditorsPicks }) {
  const initial = useMemo(() => picks.data.map((item) => item.movie), [picks]);
  const [films, setFilms] = useState(initial);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const save = useSaveEditorsPicks({
    onSuccess: () => addToast({ title: "Editors' picks saved", color: "success" }),
  });

  const dirty = ids(films) !== ids(initial);
  useUnsavedGuard(dirty);
  const posterless = films.filter((film) => !film.poster_path);
  const submit = () =>
    dirty && !save.isPending && !posterless.length && save.execute(films.map((film) => film.id));
  useSaveShortcut(submit, dirty);

  const picked = useMemo(() => new Set(films.map((film) => film.id)), [films]);
  const move = (from: number, to: number) =>
    setFilms((current) => {
      if (to < 0 || to >= current.length || from === to) return current;
      const next = [...current];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  const full = films.length >= EDITORS_PICKS_MAX;

  return (
    <>
      <PageTitle title="Editors' picks">
        The pool the home page draws its daily shelf from: {DAILY_PICKS} films a day. Order is kept as shown. Saving
        replaces the whole pool.
      </PageTitle>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title={`Pool · ${films.length} of ${EDITORS_PICKS_MAX}`}
          hint={picks.updatedBy ? `Last saved by ${picks.updatedBy.username}` : "Seeded list"}
        >
          {films.length ? (
            <ol className="flex flex-col gap-2.5">
              {films.map((film, index) => (
                <li
                  key={film.id}
                  draggable
                  onDragStart={() => setDragging(index)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOver(index);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging !== null) move(dragging, index);
                    setDragging(null);
                    setOver(null);
                  }}
                  className={`flex items-center gap-3 rounded-lg border bg-surface/50 p-2.5 pr-3 transition ${
                    over === index && dragging !== index ? "border-primary" : "border-transparent"
                  } ${dragging === index ? "opacity-40" : ""}`}
                >
                  <GripVertical size={16} className="shrink-0 cursor-grab text-muted" aria-hidden />
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{index + 1}</span>
                  <Thumb src={imageSrc(film.poster_path, "w92")} alt="" className="h-14 w-10 shrink-0 rounded" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{film.title}</span>
                    <span className={`block text-sm ${film.poster_path ? "text-muted" : "text-danger"}`}>
                      {film.poster_path ? year(film.release_date) || "Unknown year" : "No poster: remove it to save"}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Button isIconOnly size="sm" variant="light" aria-label={`Move ${film.title} to the top`} isDisabled={index === 0} onPress={() => move(index, 0)}>
                      <ChevronsUp size={15} />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Move ${film.title} up`} isDisabled={index === 0} onPress={() => move(index, index - 1)}>
                      <ArrowUp size={15} />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Move ${film.title} down`} isDisabled={index === films.length - 1} onPress={() => move(index, index + 1)}>
                      <ArrowDown size={15} />
                    </Button>
                    <Button
                      isIconOnly
                      size="md"
                      variant="light"
                      color="danger"
                      aria-label={`Remove ${film.title}`}
                      onPress={() => setFilms((current) => current.filter((value) => value.id !== film.id))}
                    >
                      <X size={15} />
                    </Button>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-muted">The pool is empty. Search for films on the right.</p>
          )}
        </Panel>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <Panel title="Add films" hint={full ? "Pool is full" : "Enter adds the highlighted film"}>
            {full ? (
              <p className="text-sm text-muted">Remove a film to make room for another.</p>
            ) : (
              <MoviePicker
                autoFocus
                requirePoster
                isPicked={(id) => picked.has(id)}
                onPick={(film) => setFilms((current) => (current.length < EDITORS_PICKS_MAX ? [...current, film] : current))}
              />
            )}
          </Panel>
        </div>
      </div>
      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        onSave={submit}
        onDiscard={() => setFilms(initial)}
        summary={`${films.length} of ${EDITORS_PICKS_MAX} films`}
        problem={posterless.length ? `${posterless.length} without a poster` : undefined}
      />
    </>
  );
}
