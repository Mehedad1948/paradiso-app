"use client";
import { useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import QueryError from "@/components/ui/QueryError";
import { useCandidates, useRemoveCandidate, useSaveCandidate } from "@/hooks/queries/useAdminQueries";
import type { AdminCandidate, CandidateFilter } from "@/lib/api/admin";
import { PageTitle, Panel } from "./shared";
import { BOOST_PRESETS, EditorialControls, PersonLine, PersonSearch, dayLabel } from "./people";

const NOTE_MAX = 500;
const FILTERS: [CandidateFilter, string][] = [
  ["all", "All"],
  ["boosted", "Boosted"],
  ["blocked", "Blocked"],
];

export default function CandidatesManager() {
  const [filter, setFilter] = useState<CandidateFilter>("all");
  const [page, setPage] = useState(1);
  const query = useCandidates(filter, page);
  const save = useSaveCandidate({ onError: (error) => addToast({ title: error.message, color: "danger" }) });
  const items = query.data?.data ?? [];

  return (
    <>
      <PageTitle title="Boost and block">
        Tune the automatic artist draw. A boost multiplies someone’s chance (0 never, 1 normal); a block keeps them
        out of the draw but you can still schedule them by hand. This only affects future automatic picks.
      </PageTitle>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel title="Edited people">
          <div className="mb-3 flex gap-2" role="tablist" aria-label="Filter">
            {FILTERS.map(([value, label]) => (
              <Button
                key={value}
                size="md"
                role="tab"
                aria-selected={filter === value}
                variant={filter === value ? "solid" : "flat"}
                color={filter === value ? "primary" : "default"}
                onPress={() => {
                  setFilter(value);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          {query.isPending ? <Spinner className="p-6" aria-label="Loading people" /> : null}
          {query.error ? <QueryError error={query.error} retry={() => query.refetch()} /> : null}
          {query.data && !items.length ? (
            <p className="py-8 text-center text-sm text-muted">
              Nobody here yet. Search for someone on the right and boost or block them.
            </p>
          ) : null}
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <CandidateRow key={`${item.tmdbPersonId}-${item.updatedAt}`} item={item} />
            ))}
          </ul>
          {query.data && query.data.meta.totalPages > 1 ? (
            <Pagination
              className="mt-4 justify-center"
              size="md"
              total={query.data.meta.totalPages}
              page={page}
              onChange={setPage}
            />
          ) : null}
        </Panel>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <Panel title="Find someone" hint="Boost or block from the result">
            <PersonSearch
              actions={(person) => (
                <span className="flex shrink-0 gap-2">
                  <Button
                    size="md"
                    variant="flat"
                    color="primary"
                    isDisabled={save.isPending}
                    onPress={() => save.execute({ tmdbPersonId: person.id, boost: Math.max(3, person.boost) })}
                  >
                    ×3
                  </Button>
                  <Button
                    size="md"
                    variant="flat"
                    color="danger"
                    isDisabled={save.isPending || person.blocked}
                    onPress={() => save.execute({ tmdbPersonId: person.id, blocked: true })}
                  >
                    Block
                  </Button>
                </span>
              )}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}

function CandidateRow({ item }: { item: AdminCandidate }) {
  const [note, setNote] = useState(item.note ?? "");
  const save = useSaveCandidate({ onError: (error) => addToast({ title: error.message, color: "danger" }) });
  const remove = useRemoveCandidate({
    onSuccess: () => addToast({ title: "Back to normal", color: "success" }),
  });
  const [confirm, setConfirm] = useState(false);
  const commitNote = () => {
    if (note.trim() !== (item.note ?? "")) save.execute({ tmdbPersonId: item.tmdbPersonId, note: note.trim() });
  };
  const person = item.person ?? { name: `Person ${item.tmdbPersonId}`, profile_path: null, knownForDepartment: null };
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line bg-surface/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PersonLine
          person={person}
          trailing={
            item.blocked ? (
              <Chip size="md" color="danger" variant="flat">Blocked</Chip>
            ) : item.boost !== 1 ? (
              <Chip size="md" color="primary" variant="flat">×{item.boost}</Chip>
            ) : null
          }
        />
        {confirm ? (
          <Button size="md" color="danger" isLoading={remove.isPending} onPress={() => remove.execute(item.tmdbPersonId)} onBlur={() => setConfirm(false)} autoFocus>
            Confirm reset
          </Button>
        ) : (
          <Button size="md" variant="light" onPress={() => setConfirm(true)}>
            Reset
          </Button>
        )}
      </div>
      <EditorialControls id={item.tmdbPersonId} boost={item.boost} blocked={item.blocked} />
      {!BOOST_PRESETS.includes(item.boost as (typeof BOOST_PRESETS)[number]) ? (
        <p className="text-sm text-muted">Custom boost ×{item.boost} set elsewhere.</p>
      ) : null}
      <Input
        size="md"
        aria-label={`Note about ${person.name}`}
        placeholder="Why? (optional note)"
        value={note}
        onValueChange={setNote}
        onBlur={commitNote}
        onKeyDown={(event) => {
          if (event.key === "Enter") commitNote();
        }}
        maxLength={NOTE_MAX}
        description={`Edited ${dayLabel(item.updatedAt.slice(0, 10), { month: "short", day: "numeric", year: "numeric" })}`}
      />
    </li>
  );
}
