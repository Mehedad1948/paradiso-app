"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Tab, Tabs } from "@heroui/tabs";
import { AltArrowLeftIcon, AltArrowRightIcon, ForbiddenCircleIcon, ShuffleIcon } from "@solar-icons/react/linear";
import {
  BACKGROUNDS,
  DEFAULT_CONFIG,
  PARTS,
  avatarDataUri,
  randomConfig,
  renderAvatarConfig,
  type AvatarConfig,
  type PartKey,
} from "../lib/avatar-builder";
import { underlinedTabs } from "../tabs";
import ResponsiveDialog from "@/components/ui/ResponsiveDialog";

const optionLabel = (value: string) => value.replace(/^variant0?/, "");

/** Design a cartoon avatar from swappable parts. Resolves with a 512×512 PNG. */
export default function AvatarBuilder({
  initial,
  onCancel,
  onApply,
}: {
  initial: AvatarConfig | null;
  onCancel: () => void;
  onApply: (file: File, config: AvatarConfig) => void;
}) {
  const [config, setConfig] = useState<AvatarConfig>(() => initial ?? DEFAULT_CONFIG);
  const tabs = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const [part, setPart] = useState<PartKey>("hair");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = PARTS.find((item) => item.key === part)!;

  const preview = useMemo(() => avatarDataUri(config, 320), [config]);
  // Thumbnails show the whole avatar with just this one part swapped, so each choice is judged
  // in context. Only the open tab is rendered.
  const thumbnails = useMemo(
    () => active.options.map((value) => [value, avatarDataUri({ ...config, [part]: value }, 96)] as const),
    [active, config, part],
  );

  // The tab strip scrolls sideways; the arrows appear only on the side that has more to reveal.
  const scroller = useCallback(
    () => tabs.current?.querySelector<HTMLElement>('[role="tablist"]') ?? null,
    [],
  );
  const measure = useCallback(() => {
    const list = scroller();
    if (!list) return;
    setEdges({
      start: list.scrollLeft > 4,
      end: list.scrollLeft + list.clientWidth < list.scrollWidth - 4,
    });
  }, [scroller]);
  useEffect(() => {
    const list = scroller();
    if (!list) return;
    measure();
    list.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [scroller, measure]);
  const slide = (direction: 1 | -1) =>
    scroller()?.scrollBy({ left: direction * 160, behavior: "smooth" });

  const set = (key: PartKey, value: string | null) => setConfig((current) => ({ ...current, [key]: value }));

  async function apply() {
    setSaving(true);
    setError(null);
    try {
      onApply(await renderAvatarConfig(config), config);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The avatar could not be saved.");
      setSaving(false);
    }
  }

  const tile = (selected: boolean) =>
    `relative aspect-square overflow-hidden rounded-xl border bg-canvas outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
      selected ? "border-ink ring-2 ring-ink" : "border-line hover:border-muted"
    }`;

  return (
    <ResponsiveDialog
      isOpen
      size="3xl"
      scrollBehavior="inside"
      // A fixed sheet height lets the option grid take whatever the preview leaves over.
      drawerClassName="h-[88dvh]"
      onClose={onCancel}
      isDismissable={!saving}
      isKeyboardDismissDisabled={saving}
      hideCloseButton={saving}
    >
      <ModalContent className="border border-line bg-elevated text-ink">
        <ModalHeader className="flex flex-col gap-1 pb-2 md:pb-4">
          <span className="text-xl font-semibold md:text-2xl tracking-[-0.04em]">Design your avatar</span>
          <span className="text-sm font-normal text-muted">Mix hair, face and outfit until it feels like you.</span>
        </ModalHeader>
        <ModalBody className="min-h-0 gap-4 overflow-hidden md:flex-row md:gap-6">
          <div className="flex shrink-0 items-center gap-4 md:w-[240px] md:flex-col">
            <img
              src={preview}
              alt="Avatar preview"
              width={240}
              height={240}
              className="aspect-square w-24 shrink-0 rounded-full border border-line shadow-lg md:w-60"
            />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3 md:items-center">
              <Button
                size="sm"
                variant="bordered"
                className="border-line"
                startContent={<ShuffleIcon size={15} aria-hidden="true" />}
                onPress={() => setConfig(randomConfig())}
                isDisabled={saving}
              >
                Surprise me
              </Button>
              <div role="radiogroup" aria-label="Background colour" className="flex flex-wrap gap-2 md:justify-center">
                {BACKGROUNDS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={config.background === color}
                    aria-label={`Background #${color}`}
                    disabled={saving}
                    onClick={() => setConfig((current) => ({ ...current, background: color }))}
                    style={{ backgroundColor: `#${color}` }}
                    className={`size-6 rounded-full border outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
                      config.background === color ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-elevated" : "border-line"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div ref={tabs} className="relative">
              <Tabs
                variant="underlined"
                aria-label="Avatar parts"
                selectedKey={part}
                onSelectionChange={(key) => setPart(key as PartKey)}
                isDisabled={saving}
                classNames={{
                  ...underlinedTabs,
                  // The default wrapper is inline-flex and grows to fit every tab, so the list
                  // would never overflow (or scroll). Pin it to the pane width instead.
                  base: "w-full min-w-0",
                  tabList: `${underlinedTabs.tabList} w-full overflow-x-auto scrollbar-hide`,
                  tab: "h-11 px-3",
                }}
              >
                {PARTS.map((item) => (
                  <Tab key={item.key} title={item.label} />
                ))}
              </Tabs>
              {(["start", "end"] as const).map((side) =>
                edges[side] ? (
                  <button
                    key={side}
                    type="button"
                    aria-label={side === "start" ? "Scroll tabs left" : "Scroll tabs right"}
                    onClick={() => slide(side === "start" ? -1 : 1)}
                    className={`absolute top-0 grid h-11 w-9 place-items-center text-ink outline-none focus-visible:text-accent ${
                      side === "start"
                        ? "left-0 bg-gradient-to-r from-elevated from-60% to-transparent"
                        : "right-0 bg-gradient-to-l from-elevated from-60% to-transparent"
                    }`}
                  >
                    {side === "start" ? <AltArrowLeftIcon size={18} aria-hidden="true" /> : <AltArrowRightIcon size={18} aria-hidden="true" />}
                  </button>
                ) : null,
              )}
            </div>
            <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-4 gap-2.5 overflow-y-auto overflow-x-hidden p-1 pt-4 sm:grid-cols-5 md:h-[380px] md:flex-none">
              {active.optional && (
                <li>
                  <button
                    type="button"
                    aria-pressed={config[part] === null}
                    aria-label={`No ${active.label.toLowerCase()}`}
                    disabled={saving}
                    onClick={() => set(part, null)}
                    className={`${tile(config[part] === null)} grid w-full place-items-center text-muted`}
                  >
                    <ForbiddenCircleIcon size={22} aria-hidden="true" />
                  </button>
                </li>
              )}
              {thumbnails.map(([value, src]) => (
                <li key={value}>
                  <button
                    type="button"
                    aria-pressed={config[part] === value}
                    aria-label={`${active.label} ${optionLabel(value)}`}
                    disabled={saving}
                    onClick={() => set(part, value)}
                    className={`${tile(config[part] === value)} w-full`}
                  >
                    <img src={src} alt="" width={96} height={96} loading="lazy" className="size-full" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ModalBody>
        {error && (
          <p role="alert" className="px-6 text-sm text-danger-500">
            {error}
          </p>
        )}
        <ModalFooter className="mt-1 border-t border-line pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="light" onPress={onCancel} isDisabled={saving}>
            Cancel
          </Button>
          <Button className="bg-ink font-semibold text-canvas" onPress={() => void apply()} isLoading={saving}>
            Looks like me 😎
          </Button>
        </ModalFooter>
      </ModalContent>
    </ResponsiveDialog>
  );
}
