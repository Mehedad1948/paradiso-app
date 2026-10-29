"use client";
import Link from "next/link";
import { useState } from "react";
import { useAdminEditorsPicks, useAdminLandingGrid } from "@/hooks/queries/useCurationQueries";
import { useFeaturedDays } from "@/hooks/queries/useAdminQueries";
import { GRID_SLOTS } from "@/lib/curations/grid";
import { EDITORS_PICKS_MAX } from "@/types/curations";
import { PageTitle } from "./shared";
import { ADMIN_TOOLS } from "./nav";
import { addDays, dayLabel, utcDay } from "./people";

/** One line of live status per tool, so the overview doubles as a health check. */
function useStatus(): Record<string, string> {
  const [today] = useState(() => utcDay());
  const grid = useAdminLandingGrid();
  const picks = useAdminEditorsPicks();
  const days = useFeaturedDays(today, addDays(today, 6));
  const status: Record<string, string> = {};
  if (grid.data) status["/admin/landing"] = `${grid.data.data.length} of ${GRID_SLOTS} frames filled`;
  if (picks.data) status["/admin/picks"] = `${picks.data.data.length} of ${EDITORS_PICKS_MAX} films`;
  if (days.data) {
    const todays = days.data.data.find((item) => item.date === today);
    const scheduled = days.data.data.filter((item) => item.source === "manual" && item.date >= today).length;
    status["/admin/artists"] = `${todays ? `Today: ${todays.person.name}` : "Today: automatic draw"} · ${scheduled} scheduled this week`;
  }
  return status;
}

export default function Overview() {
  const status = useStatus();
  const [today] = useState(() => utcDay());
  return (
    <>
      <PageTitle title="Overview">
        Today is {dayLabel(today, { weekday: "long", month: "long", day: "numeric" })} (UTC). Press{" "}
        <kbd className="rounded bg-surface px-1">Ctrl K</kbd> anywhere to jump to a tool.
      </PageTitle>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex h-full flex-col gap-2 rounded-xl border border-line bg-elevated p-4 transition-colors hover:border-primary"
            >
              <span className="font-medium">{tool.label}</span>
              <span className="text-sm text-muted">{tool.blurb}</span>
              <span className="mt-2 min-h-4 text-sm text-primary">{status[tool.href]}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-2xl text-sm text-muted">
        Your role is copied into your sign-in when it is issued, so a change to it applies after you next sign in.
        Lists are saved whole: if two people edit one list, the last save wins, so reload before a long edit.
      </p>
    </>
  );
}
