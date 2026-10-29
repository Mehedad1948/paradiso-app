"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { Input } from "@heroui/input";
import { Modal, ModalContent } from "@heroui/modal";
import { Command, Home, LayoutGrid } from "lucide-react";
import { ADMIN_TOOLS } from "./nav";
import { hasUnsavedChanges } from "./shared";

const LEAVE_MESSAGE = "You have unsaved changes. Leave without saving?";

/** The admin chrome: a side menu on wide screens, a scrolling bar on phones, and Ctrl+K to jump. */
export default function AdminShell({ username, children }: { username: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const guard = (event: MouseEvent) => {
    if (hasUnsavedChanges() && !window.confirm(LEAVE_MESSAGE)) event.preventDefault();
  };
  const links = [{ href: "/admin", label: "Overview" }, ...ADMIN_TOOLS];
  // The deepest link containing this page wins, so "Boost and block" does not light up "Featured artist".
  const activeHref = links
    .filter((link) => pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (href: string) => href === activeHref;

  return (
    <div className="min-h-svh md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="relative border-b border-line bg-elevated md:sticky md:top-0 md:h-svh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 md:flex-col md:items-start md:gap-0 md:pt-6">
          <div>
            <p className="text-base font-semibold">Paradiso admin</p>
            <p className="text-sm text-muted">{username}</p>
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface md:mt-5 md:w-full"
          >
            <Command size={14} aria-hidden />
            <span className="md:flex-1 md:text-left">Jump to…</span>
            <kbd className="hidden rounded bg-surface px-1.5 py-0.5 text-xs md:inline">Ctrl K</kbd>
          </button>
        </div>
        <nav aria-label="Admin" className="flex gap-2 overflow-x-auto px-4 py-3 md:mt-4 md:flex-col md:gap-1.5 md:overflow-visible">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={guard}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-base transition-colors ${
                isActive(link.href) ? "bg-primary/15 font-medium text-primary" : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          onClick={guard}
          className="hidden items-center gap-2 px-7 py-3 text-sm text-muted hover:text-ink md:absolute md:bottom-4 md:flex"
        >
          <Home size={15} aria-hidden /> Back to the site
        </Link>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
      <Palette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onGo={(href) => {
          setPaletteOpen(false);
          if (!hasUnsavedChanges() || window.confirm(LEAVE_MESSAGE)) router.push(href);
        }}
      />
    </div>
  );
}

function Palette({ isOpen, onClose, onGo }: { isOpen: boolean; onClose: () => void; onGo: (href: string) => void }) {
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const matches = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const all = [{ href: "/admin", label: "Overview", blurb: "Where things stand.", keywords: "home status" }, ...ADMIN_TOOLS];
    return needle ? all.filter((tool) => `${tool.label} ${tool.keywords}`.toLowerCase().includes(needle)) : all;
  }, [term]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setTerm("");
        setActive(0);
      }}
      placement="top"
      size="md"
      hideCloseButton
    >
      <ModalContent>
        {() => (
          <div className="p-4">
            <Input
              autoFocus
              size="lg"
              aria-label="Jump to"
              placeholder="Jump to a tool…"
              value={term}
              onValueChange={(value) => {
                setTerm(value);
                setActive(0);
              }}
              startContent={<LayoutGrid size={18} className="text-muted" aria-hidden />}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((index) => Math.min(index + 1, matches.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter" && matches[active]) {
                  event.preventDefault();
                  onGo(matches[active].href);
                }
              }}
            />
            <ul className="mt-3 flex flex-col gap-1">
              {matches.map((tool, index) => (
                <li key={tool.href}>
                  <button
                    type="button"
                    onClick={() => onGo(tool.href)}
                    onMouseMove={() => setActive(index)}
                    className={`flex w-full flex-col rounded-lg px-4 py-3 text-left ${index === active ? "bg-surface" : ""}`}
                  >
                    <span className="text-base font-medium">{tool.label}</span>
                    <span className="text-sm text-muted">{tool.blurb}</span>
                  </button>
                </li>
              ))}
              {!matches.length ? <li className="px-3 py-2 text-sm text-muted">Nothing matches.</li> : null}
            </ul>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
