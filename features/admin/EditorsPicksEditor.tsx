"use client";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, DoubleAltArrowUpIcon, GripVerticalIcon } from "@solar-icons/react/linear";
import QueryError from "@/components/ui/QueryError";
import { useAdminEditorsPicks, useSaveEditorsPicks } from "@/hooks/queries/useCurationQueries";
import {
  DAILY_PICKS,
  EDITORS_PICKS_MAX,
  type AdminEditorsPicks,
  type CuratedMovie,
  type EditorsPickItem,
} from "@/types/curations";
import CoverPicker from "./CoverPicker";
import { MoviePicker, PageTitle, Panel, SaveBar, Thumb, imageSrc, useSaveShortcut, useUnsavedGuard, year } from "./shared";

/** A pick's identity for change detection: the film and its cover, in order. */
const signature = (picks: EditorsPickItem[]) => picks.map((pick) => `${pick.movie.id}|${pick.imageUrl ?? ""}`).join();
/** What the shelf shows for a pick: its own cover, else the film's poster. */
const coverOf = (pick: EditorsPickItem) => pick.imageUrl ?? pick.movie.poster_path;

export default function EditorsPicksEditor() {
  const query = useAdminEditorsPicks();
  if (query.isPending) return <Spinner className="p-8" aria-label="Loading the picks" />;
  if (query.error || !query.data)
    return <QueryError error={query.error ?? new Error("Could not load the picks.")} retry={() => query.refetch()} />;
  // A fresh save has a new timestamp: the editor restarts from what the server stored.
  return <Editor key={query.data.updatedAt} picks={query.data} />;
}

function Editor({ picks }: { picks: AdminEditorsPicks }) {
  const initial = useMemo(() => picks.data, [picks]);
  const [films, setFilms] = useState(initial);
  const [covering, setCovering] = useState<CuratedMovie | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const save = useSaveEditorsPicks({
    onSuccess: () => addToast({ title: "Editors' picks saved", color: "success" }),
  });

  const dirty = signature(films) !== signature(initial);
  useUnsavedGuard(dirty);
  const posterless = films.filter((pick) => !coverOf(pick));
  // The whole pool is sent every time, each pick with the cover it already has.
  const submit = () =>
    dirty &&
    !save.isPending &&
    !posterless.length &&
    save.execute(films.map((pick) => ({ movieId: pick.movie.id, imageUrl: pick.imageUrl })));
  useSaveShortcut(submit, dirty);

  const picked = useMemo(() => new Set(films.map((pick) => pick.movie.id)), [films]);
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
              {films.map((pick, index) => {
                const film = pick.movie;
                const cover = coverOf(pick);
                return (
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
                  <GripVerticalIcon size={16} className="shrink-0 cursor-grab text-muted" aria-hidden />
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{index + 1}</span>
                  <Thumb src={imageSrc(cover, "w92")} alt="" className="h-14 w-10 shrink-0 rounded" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{film.title}</span>
                    <span className={`block text-sm ${cover ? "text-muted" : "text-danger"}`}>
                      {cover
                        ? `${year(film.release_date) || "Unknown year"}${pick.imageUrl ? " · Custom cover" : ""}`
                        : "No poster or cover: choose a cover or remove it"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="flat" aria-label={`Choose a cover for ${film.title}`} onPress={() => setCovering(film)}>
                      Cover
                    </Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Move ${film.title} to the top`} isDisabled={index === 0} onPress={() => move(index, 0)}>
                      <DoubleAltArrowUpIcon size={15} />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Move ${film.title} up`} isDisabled={index === 0} onPress={() => move(index, index - 1)}>
                      <ArrowUpIcon size={15} />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" aria-label={`Move ${film.title} down`} isDisabled={index === films.length - 1} onPress={() => move(index, index + 1)}>
                      <ArrowDownIcon size={15} />
                    </Button>
                    <Button
                      isIconOnly
                      size="md"
                      variant="light"
                      color="danger"
                      aria-label={`Remove ${film.title}`}
                      onPress={() => setFilms((current) => current.filter((value) => value.movie.id !== film.id))}
                    >
                      <CloseIcon size={15} />
                    </Button>
                  </span>
                </li>
                );
              })}
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
                onPick={(film) =>
                  setFilms((current) =>
                    current.length < EDITORS_PICKS_MAX ? [...current, { movie: film, imageUrl: null }] : current,
                  )
                }
              />
            )}
          </Panel>
        </div>
      </div>
      {covering ? (
        <CoverPicker
          key={covering.id}
          film={covering}
          current={films.find((pick) => pick.movie.id === covering.id)?.imageUrl ?? null}
          onChoose={(imageUrl) => {
            setFilms((current) => current.map((pick) => (pick.movie.id === covering.id ? { ...pick, imageUrl } : pick)));
            setCovering(null);
          }}
          onClose={() => setCovering(null)}
        />
      ) : null}
      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        onSave={submit}
        onDiscard={() => setFilms(initial)}
        summary={`${films.length} of ${EDITORS_PICKS_MAX} films`}
        problem={posterless.length ? `${posterless.length} without a poster or cover` : undefined}
      />
    </>
  );
}
