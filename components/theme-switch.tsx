"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { SwitchProps } from "@heroui/switch";
import clsx from "clsx";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
}

export function ThemeSwitch({ className, classNames }: ThemeSwitchProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className={clsx("inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-ink hover:bg-surface max-[480px]:size-10", className, classNames?.base)}
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon size={20} className="dark:hidden" aria-hidden="true" />
      <Sun size={20} className="hidden dark:block" aria-hidden="true" />
    </button>
  );
}
