import type { ReactNode } from "react";
import type { Icon as SolarIcon } from "@solar-icons/react/lib/types";
import type { SettingsSectionId } from "../sections";

/** One card on the settings page. The id is its anchor, so it clears the fixed header. */
export default function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  id: SettingsSectionId;
  icon: SolarIcon;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-32 overflow-hidden rounded-3xl border border-line bg-elevated shadow-[0_1px_0_rgb(0_0_0/0.02),0_24px_48px_-32px_rgb(0_0_0/0.25)] max-lg:scroll-mt-40"
    >
      <header className="flex items-start gap-4 px-7 pt-7 max-sm:px-5 max-sm:pt-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-ink">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 id={`${id}-title`} className="text-xl font-semibold leading-tight tracking-[-0.03em]">
            {title}
          </h2>
          <p className="mt-1 text-sm font-normal text-muted">{description}</p>
        </div>
      </header>
      <div className="px-7 pb-7 pt-7 max-sm:px-5 max-sm:pb-6">{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-surface/40 px-7 py-4 max-sm:px-5">
          {footer}
        </div>
      )}
    </section>
  );
}
