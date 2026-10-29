"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { fontIntertitle, fontLogo, fontSans } from "@/config/fonts";
import FuzzyText from "@/components/ui/FuzzyText";
import styles from "./ErrorScreen.module.css";

// Defined on the `.number` wrapper, which also reserves the canvas's height.
const DIGIT_SIZE = "var(--digit)";

/**
 * A silent-film title card for error and not-found pages: the status code
 * glitches like a damaged reel, the intertitle says what happened.
 * `FuzzyText` draws the code to a canvas; its screen-reader label is the code.
 */
export default function ErrorScreen({
  code,
  kicker,
  title,
  children,
  actions,
  note,
}: {
  code: string;
  kicker: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  note?: string;
}) {
  return (
    <div
      className={`${fontSans.variable} ${fontIntertitle.variable} ${fontLogo.variable} ${styles.screen}`}
    >
      <div className={styles.beam} aria-hidden="true" />
      <div className={styles.card} aria-hidden="true" />
      <div className={styles.scroller}>
        <main className={styles.content}>
          <p className={styles.kicker}>{kicker}</p>
          <div className={styles.number}>
            <FuzzyText
              fontSize={DIGIT_SIZE}
              fontWeight={800}
              colorSplit={0.6}
              trigger="hover"
              direction="horizontal"
              baseIntensity={0.04}
              hoverIntensity={0.7}
              fuzzRange={50}
              sliceSize={5}
              fps={60}
              transitionDuration={4}
              intro
              introDuration={1100}
              letterSpacing={0}
              enableHover
              clickEffect={false}
              glitchMode
              glitchInterval={1600}
              glitchDuration={240}
            >
              {code}
            </FuzzyText>
          </div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.text}>{children}</p>
          <div className={styles.rule} aria-hidden="true">
            <i />
          </div>
          <div className={styles.actions}>{actions}</div>
          {note && <p className={styles.note}>{note}</p>}
          <p className={styles.signoff} aria-hidden="true">
            Paradiso
          </p>
        </main>
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <i className={styles.scratch} aria-hidden="true" />
      <i className={styles.scratch} style={{ left: "63vw" }} aria-hidden="true" />
    </div>
  );
}

/**
 * A button-styled action for `ErrorScreen`. With `href` it is a link (a plain
 * anchor when `hardNav` is set, for screens that render outside the app router).
 */
export function ScreenAction({
  href,
  hardNav = false,
  onClick,
  primary = false,
  children,
}: {
  href?: string;
  hardNav?: boolean;
  onClick?: () => void;
  primary?: boolean;
  children: ReactNode;
}) {
  const className = `${styles.action} ${primary ? styles.primary : ""}`.trim();
  if (href === undefined) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    );
  }
  return hardNav ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
