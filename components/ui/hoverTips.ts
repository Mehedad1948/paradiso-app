/**
 * Lightweight hover hints for dense lists. Any element with `data-tip="..."` gets a small
 * tooltip after a short hover (or keyboard focus). One set of document listeners serves the
 * whole page, so a feed of hundreds of buttons mounts no tooltip components at all.
 *
 * The hint is visual only: give the element its own `aria-label` as well.
 */

const DELAY = 400;
const GAP = 8;
const EDGE = 8;
// Mirrors HeroUI's small tooltip.
const TIP_CLASS =
  "pointer-events-none fixed left-0 top-0 z-[9999] max-w-[260px] rounded-medium bg-content1 px-2.5 py-1 text-tiny font-normal text-foreground shadow-medium opacity-0 transition-opacity duration-150 ease-out data-[open]:opacity-100";

let installed = false;

function install() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  let tip: HTMLDivElement | null = null;
  let anchor: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const find = (target: EventTarget | null) =>
    target instanceof Element ? target.closest<HTMLElement>("[data-tip]") : null;

  function show(element: HTMLElement) {
    const label = element.dataset.tip;
    // An open menu on the trigger would sit under the hint.
    if (!label || !element.isConnected || element.querySelector("[aria-expanded='true']")) return;
    if (!tip) {
      tip = document.createElement("div");
      tip.setAttribute("role", "presentation");
      tip.className = TIP_CLASS;
      document.body.appendChild(tip);
    }
    tip.textContent = label;
    const box = element.getBoundingClientRect();
    const { width, height } = tip.getBoundingClientRect();
    const below = box.top - height - GAP < EDGE;
    const x = Math.min(
      Math.max(box.left + box.width / 2 - width / 2, EDGE),
      document.documentElement.clientWidth - width - EDGE,
    );
    const y = below ? box.bottom + GAP : box.top - height - GAP;
    tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    tip.setAttribute("data-open", "");
  }

  function hide() {
    clearTimeout(timer);
    anchor = null;
    tip?.removeAttribute("data-open");
  }

  function schedule(element: HTMLElement) {
    if (anchor === element) return;
    hide();
    anchor = element;
    timer = setTimeout(() => show(element), DELAY);
  }

  document.addEventListener(
    "pointerover",
    (event) => {
      if (event.pointerType !== "mouse") return;
      const element = find(event.target);
      if (element) schedule(element);
      else if (anchor) hide();
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerout",
    (event) => {
      if (anchor && !anchor.contains(event.relatedTarget as Node | null)) hide();
    },
    { passive: true },
  );
  document.addEventListener("focusin", (event) => {
    const element = find(event.target);
    if (element && (event.target as Element).matches(":focus-visible")) schedule(element);
    else hide();
  });
  document.addEventListener("focusout", hide);
  // Pressing, scrolling or Escape dismiss the hint, as HeroUI's tooltip does.
  document.addEventListener("pointerdown", hide, { capture: true, passive: true });
  document.addEventListener("scroll", hide, { capture: true, passive: true });
  document.addEventListener("keydown", (event) => event.key === "Escape" && hide());
}

/** Props for an element that shows `label` as a hover hint. */
export function hoverTip(label: string) {
  install();
  return { "data-tip": label } as const;
}
