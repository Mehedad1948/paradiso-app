"use client";
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { gsap } from "gsap";
import { Drawer, DrawerContent } from "@heroui/drawer";

/** Adapted from React Bits' StaggeredMenu: colored layers sweep in one after another, then the
 * panel, then the panel's sections rise into place. Closing slides everything back out. */

export type StaggeredDrawerHandle = { close: () => void };

const EXIT_S = 0.32;

// HeroUI unmounts the dialog after its exit variant. GSAP owns the movement, so the variants
// only hold the dialog in the DOM (an imperceptible opacity change) while the layers slide out.
const motionProps = {
  variants: {
    enter: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 0.999, transition: { duration: EXIT_S } },
  },
};

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** The underlay colors: a tint of the accent, then the accent itself. */
export function layerColors(accent?: string | null) {
  const color = accent || "hsl(var(--heroui-primary-500))";
  return [`color-mix(in srgb, ${color} 35%, hsl(var(--heroui-content1)))`, color];
}

export default function StaggeredDrawer({
  ref,
  children,
  onClose,
  placement = "right",
  size = "md",
  colors = layerColors(),
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  className = "",
  backdropClassName,
}: {
  ref?: Ref<StaggeredDrawerHandle>;
  children: ReactNode;
  /** Called once the exit animation has finished; the parent should unmount the drawer then. */
  onClose: () => void;
  placement?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  colors?: string[];
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  /** Classes for the drawer base, e.g. its width. */
  className?: string;
  backdropClassName?: string;
}) {
  // Close in two steps so the exit can play: flip `isOpen` (fades the backdrop) while GSAP
  // slides the panel out, then let the parent unmount.
  const [open, setOpen] = useState(true);
  const stage = useRef<StageHandle>(null);
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    if (stage.current) stage.current.playClose(onClose);
    else onClose();
  }, [onClose]);
  useImperativeHandle(ref, () => ({ close }), [close]);

  return (
    <Drawer
      isOpen={open}
      placement={placement}
      size={size}
      onClose={close}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      hideCloseButton
      motionProps={motionProps}
      classNames={{
        backdrop: backdropClassName,
        base: `overflow-hidden rounded-none bg-transparent text-ink shadow-none sm:m-0 ${className}`,
      }}
    >
      <DrawerContent>
        {() => (
          <Stage ref={stage} placement={placement} colors={colors}>
            {children}
          </Stage>
        )}
      </DrawerContent>
    </Drawer>
  );
}

type StageHandle = { playClose: (done: () => void) => void };

function Stage({
  ref,
  placement,
  colors,
  children,
}: {
  ref: Ref<StageHandle>;
  placement: "left" | "right";
  colors: string[];
  children: ReactNode;
}) {
  const layersRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anim = useRef<gsap.core.Animation | null>(null);
  const offscreen = placement === "left" ? -100 : 100;

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const layers = Array.from(layersRef.current?.children ?? []);
    if (!panel || prefersReducedMotion()) return;
    const sections = Array.from(panel.children);
    const panelAt = layers.length ? (layers.length - 1) * 0.07 + 0.08 : 0;
    // fromTo renders its start state immediately, so nothing flashes before the first frame.
    anim.current = gsap
      .timeline()
      .fromTo(
        layers,
        { xPercent: offscreen },
        { xPercent: 0, duration: 0.5, ease: "power4.out", stagger: 0.07 },
        0,
      )
      .fromTo(
        panel,
        { xPercent: offscreen },
        { xPercent: 0, duration: 0.65, ease: "power4.out", clearProps: "transform" },
        panelAt,
      )
      .fromTo(
        sections,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.08,
          clearProps: "transform,opacity",
        },
        panelAt + 0.1,
      );
    return () => {
      anim.current?.kill();
    };
  }, [offscreen]);

  useImperativeHandle(
    ref,
    () => ({
      playClose(done) {
        anim.current?.kill();
        const panel = panelRef.current;
        if (!panel || prefersReducedMotion()) return done();
        const layers = Array.from(layersRef.current?.children ?? []);
        anim.current = gsap.to([...layers, panel], {
          xPercent: offscreen,
          duration: EXIT_S,
          ease: "power3.in",
          onComplete: done,
        });
      },
    }),
    [offscreen],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={layersRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
        {colors.map((color, index) => (
          <div key={index} className="absolute inset-0" style={{ background: color }} />
        ))}
      </div>
      <div
        ref={panelRef}
        className={`relative z-10 flex min-h-0 flex-1 flex-col border-line bg-elevated ${
          placement === "left" ? "border-r" : "border-l"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
