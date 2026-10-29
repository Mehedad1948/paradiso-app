import { KeyMinimalisticIcon, ShieldIcon, StarsMinimalisticIcon, UserRoundedIcon } from "@solar-icons/react/linear";
import type { Icon as SolarIcon } from "@solar-icons/react/lib/types";

export type SettingsSectionId = "profile" | "taste" | "privacy" | "security";

/** The settings page's sections, in page order. Ids double as URL hashes (`/settings#privacy`). */
export const SETTINGS_SECTIONS: readonly { id: SettingsSectionId; label: string; icon: SolarIcon }[] = [
  { id: "profile", label: "Profile", icon: UserRoundedIcon },
  { id: "taste", label: "Taste", icon: StarsMinimalisticIcon },
  { id: "privacy", label: "Privacy", icon: ShieldIcon },
  { id: "security", label: "Security", icon: KeyMinimalisticIcon },
];

export const settingsHref = (section?: SettingsSectionId) =>
  section ? `/settings#${section}` : "/settings";
