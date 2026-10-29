"use client";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import QueryError from "@/components/ui/QueryError";
import ResponsiveDialog from "@/components/ui/ResponsiveDialog";
import { useFeaturedDays, useRemoveFeaturedDay, useSetFeaturedDay } from "@/hooks/queries/useAdminQueries";
import type { AdminFeaturedDay, AdminPerson } from "@/lib/api/admin";
import { PageTitle } from "./shared";
import { PersonLine, PersonPreview, PersonSearch, addDays, dayLabel, utcDay } from "./people";

const AHEAD = 30;
const BEHIND = 14;
const TAGLINE_MAX = 140;

export default function ArtistSchedule() {
  const [today] = useState(() => utcDay());
  const from = addDays(today, -BEHIND);
  const to = addDays(today, AHEAD - 1);
  const query = useFeaturedDays(from, to);
  const [editing, setEditing] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const remove = useRemoveFeaturedDay({
    onSuccess: () => addToast({ title: "Pick removed", color: "success" }),
  });

  const byDay = useMemo(() => new Map((query.data?.data ?? []).map((item) => [item.date, item])), [query.data]);
  const days = useMemo(() => {
    const first = showPast ? -BEHIND : 0;
    return Array.from({ length: AHEAD - first }, (_, index) => addDays(today, first + index));
  }, [today, showPast]);

  if (query.isPending) return <Spinner className="p-8" aria-label="Loading the schedule" />;
  if (query.error) return <QueryError error={query.error} retry={() => query.refetch()} />;

  return (
    <>
      <PageTitle title="Featured artist">
        One artist a day (UTC). A day you leave empty is filled by the automatic draw. Scheduling a person yourself
        ignores cooldowns and blocks.
      </PageTitle>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {days.length} days from {dayLabel(days[0])}
        </span>
        <Button size="md" variant="flat" onPress={() => setShowPast((value) => !value)}>
          {showPast ? "Hide previous days" : "Show previous 14 days"}
        </Button>
      </div>
      <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-elevated">
        {days.map((day) => (
          <DayRow
            key={day}
            day={day}
            today={today}
            pick={byDay.get(day)}
            removing={remove.isPending}
            onEdit={() => setEditing(day)}
            onRemove={() => remove.execute(day)}
          />
        ))}
      </ul>
      {editing ? (
        <PickDialog key={editing} day={editing} current={byDay.get(editing)} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}

function DayRow({
  day,
  today,
  pick,
  removing,
  onEdit,
  onRemove,
}: {
  day: string;
  today: string;
  pick?: AdminFeaturedDay;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const past = day < today;
  const [confirm, setConfirm] = useState(false);
  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 ${day === today ? "bg-primary/10" : ""}`}>
      <div className="w-28 shrink-0">
        <p className="text-sm font-medium">{dayLabel(day)}</p>
        {day === today ? <p className="text-sm text-primary">Today</p> : <p className="text-sm text-muted">{day}</p>}
      </div>
      <div className="min-w-0 flex-1">
        {pick ? (
          <div>
            <PersonLine
              person={pick.person}
              trailing={
                <Chip size="md" variant="flat" color={pick.source === "manual" ? "primary" : "default"}>
                  {pick.source === "manual" ? "Scheduled" : "Auto"}
                </Chip>
              }
            />
            {pick.tagline ? <p className="mt-1 pl-14 text-sm italic text-muted">“{pick.tagline}”</p> : null}
          </div>
        ) : (
          <span className="text-sm text-muted">{past ? "No pick" : "Automatic draw"}</span>
        )}
      </div>
      {past ? null : (
        <div className="flex shrink-0 gap-2.5">
          <Button size="md" variant={pick ? "flat" : "solid"} color={pick ? "default" : "primary"} onPress={onEdit}>
            {pick ? "Change" : "Schedule"}
          </Button>
          {pick ? (
            confirm ? (
              <Button
                size="md"
                color="danger"
                isLoading={removing}
                onPress={() => {
                  onRemove();
                  setConfirm(false);
                }}
                onBlur={() => setConfirm(false)}
                autoFocus
              >
                Confirm
              </Button>
            ) : (
              <Button size="md" variant="light" color="danger" onPress={() => setConfirm(true)}>
                Remove
              </Button>
            )
          ) : null}
        </div>
      )}
    </li>
  );
}

function PickDialog({ day, current, onClose }: { day: string; current?: AdminFeaturedDay; onClose: () => void }) {
  const [chosen, setChosen] = useState<AdminPerson | null>(null);
  const [tagline, setTagline] = useState(current?.tagline ?? "");
  const save = useSetFeaturedDay({
    onSuccess: () => {
      addToast({ title: `Scheduled for ${dayLabel(day)}`, color: "success" });
      onClose();
    },
  });
  const canSave = !!chosen && chosen.eligible && tagline.length <= TAGLINE_MAX && !save.isPending;
  const submit = () => canSave && save.execute({ date: day, tmdbPersonId: chosen.id, tagline: tagline.trim() || undefined });

  return (
    <ResponsiveDialog isOpen onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span>{dayLabel(day, { weekday: "long", month: "long", day: "numeric" })}</span>
              {current ? <span className="text-sm font-normal text-muted">Replacing {current.person.name}</span> : null}
            </ModalHeader>
            <ModalBody className="grid gap-5 md:grid-cols-2">
              <PersonSearch autoFocus onSelect={setChosen} selectedId={chosen?.id} />
              <div className="flex flex-col gap-4">
                {chosen ? (
                  <>
                    <PersonLine person={chosen} />
                    {!chosen.eligible ? (
                      <p className="text-sm text-warning">
                        Needs both a photo and a biography on TMDb before it can be featured.
                      </p>
                    ) : null}
                    <PersonPreview id={chosen.id} />
                    <Input
                      size="md"
                      label="Tagline (optional)"
                      labelPlacement="outside"
                      placeholder="A line shown with the artist"
                      value={tagline}
                      onValueChange={setTagline}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submit();
                      }}
                      isInvalid={tagline.length > TAGLINE_MAX}
                      description={`${tagline.length}/${TAGLINE_MAX}`}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted">Pick someone from the results to see how they would fare.</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" isLoading={save.isPending} isDisabled={!canSave} onPress={submit}>
                Schedule{chosen ? ` ${chosen.name}` : ""}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </ResponsiveDialog>
  );
}
