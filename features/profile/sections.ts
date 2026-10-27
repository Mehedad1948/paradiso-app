import { KeyRound, Shield, Sparkles, UserRound, type LucideIcon } from "lucide-react";

export type SettingsSectionId = "profile" | "taste" | "privacy" | "security";

/** The settings page's sections, in page order. Ids double as URL hashes (`/settings#privacy`). */
export const SETTINGS_SECTIONS: readonly { id: SettingsSectionId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "taste", label: "Taste", icon: Sparkles },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "security", label: "Security", icon: KeyRound },
];

export const settingsHref = (section?: SettingsSectionId) =>
  section ? `/settings#${section}` : "/settings";
