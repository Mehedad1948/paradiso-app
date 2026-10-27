"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "../sections";

const ids = SETTINGS_SECTIONS.map((section) => section.id);

/** The section whose top has crossed a line a third of the way down the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<SettingsSectionId>(ids[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current = ids[0];
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = id;
      }
      // The last section may be too short to reach the line; the page bottom selects it.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4)
        current = ids[ids.length - 1];
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return active;
}

/** Jump links for the settings page: a sticky rail on desktop, a sticky pill bar on smaller screens. */
export default function SettingsNav() {
  const active = useActiveSection();
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 460, damping: 38 };

  function jump(event: React.MouseEvent<HTMLAnchorElement>, id: SettingsSectionId) {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <>
      <nav aria-label="Settings sections" className="sticky top-32 hidden self-start lg:block">
        <ul className="flex flex-col gap-1">
          {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
            const current = id === active;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(event) => jump(event, id)}
                  aria-current={current ? "location" : undefined}
                  className={clsx(
                    "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                    current ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {current && (
                    <motion.span
                      layoutId="settings-nav-rail"
                      transition={spring}
                      className="absolute inset-0 rounded-2xl border border-line bg-elevated shadow-sm"
                    >
                      {/* Centred with margins, not a translate: layout animations own `transform`. */}
                      <span className="absolute inset-y-0 -left-px my-auto h-5 w-[3px] rounded-full bg-accent" />
                    </motion.span>
                  )}
                  <Icon size={18} aria-hidden="true" className="relative" />
                  <span className="relative">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Settings sections"
        className="sticky top-[72px] z-30 -mx-[5vw] mb-2 border-b border-line bg-canvas/80 px-[5vw] backdrop-blur-xl md:top-[88px] md:-mx-[4.5vw] md:px-[4.5vw] lg:hidden"
      >
        <ul className="flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
            const current = id === active;
            return (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  onClick={(event) => jump(event, id)}
                  aria-current={current ? "location" : undefined}
                  className={clsx(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                    current ? "text-canvas" : "text-muted hover:text-ink",
                  )}
                >
                  {current && (
                    <motion.span
                      layoutId="settings-nav-pill"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-ink"
                    />
                  )}
                  <Icon size={15} aria-hidden="true" className="relative" />
                  <span className="relative">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
