import Link from "next/link";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import ParadisoWordmark from "@/components/landing/ParadisoWordmark";
import CinemaGrid from "@/components/landing/CinemaGrid";
import JuryReveal from "@/components/landing/JuryReveal";
import FilmNegatives from "@/components/landing/FilmNegatives";
import styles from "@/components/landing/CinemaHero.module.css";
import { fontDisplay } from "@/config/fonts";

export const metadata: Metadata = {
  title: { absolute: "Paradiso — cinema for your circle" },
  description:
    "Find your next favorite film, gather your people, and make a night of it with Paradiso.",
};

// Each verb is finished by a small tag: "Gather your people", etc.
const verbs = [
  { word: "Gather", rest: "your people", indent: "0cqi" },
  { word: "Pick", rest: "the films", indent: "16cqi" },
  { word: "Judge", rest: "the winner", indent: "5cqi", accent: true },
];

export default async function Home() {
  "use cache";
  cacheLife("hours");

  return (
    <div className="relative isolate min-h-svh overflow-x-clip bg-canvas px-[4.5vw] pb-0 pt-28 text-ink max-sm:px-[5vw] max-sm:pt-28 max-[480px]:pt-36">
      <FilmNegatives />
      <section
        id="landing"
        className="mx-auto max-w-[1600px] scroll-mt-32"
        aria-labelledby="landing-title"
      >
        <h1 id="landing-title" className="sr-only">
          Cinema Paradiso — cinema for your circle
        </h1>
        <div className={styles.hero}>
          <ParadisoWordmark />
        </div>
        <div className="flex items-end justify-between gap-10 pb-14 pt-12 [&>h2]:text-[clamp(38px,4.2vw,68px)] [&>h2]:font-semibold [&>h2]:leading-[1.08] [&>h2]:tracking-[-0.065em] [&>h2_span]:font-serif [&>h2_span]:font-normal [&>h2_span]:italic [&>h2_span]:tracking-[-0.045em] max-sm:flex-col max-sm:items-start max-sm:gap-6 max-sm:pb-9 max-sm:pt-8 max-sm:[&>h2]:text-[clamp(34px,10.8vw,48px)]">
          <h2>
            Good films
            <br /> 
            <span>Better company.</span>
          </h2>
          <div className="max-w-[380px] [&>p]:mb-6 [&>p]:text-base [&>p]:leading-[1.75] [&>p]:text-muted max-lg:max-w-[300px] max-sm:w-full max-sm:max-w-none">
            <p>
              A place to find your next favorite film, gather your people, and
              make a night of it.
            </p>
            <Link href="/rooms" className="inline-flex items-center justify-between gap-11 rounded-md bg-ink px-6 py-4 text-[15px] font-semibold text-canvas transition-colors hover:bg-accent hover:text-on-accent [&>svg]:transition-transform hover:[&>svg]:translate-x-0.5 hover:[&>svg]:-translate-y-0.5 motion-reduce:transition-none max-sm:w-full">
              Enter dashboard <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <section
        id="the-archive"
        className="mx-auto grid max-w-[1600px] scroll-mt-32 grid-cols-2 items-center gap-[clamp(24px,4vw,72px)] border-t border-line py-[clamp(56px,7vw,112px)] max-sm:grid-cols-1 max-sm:gap-12"
        aria-labelledby="archive-title"
      >
        <div className={`${fontDisplay.variable} relative z-10 [container-type:inline-size]`}>
          <h2 id="archive-title" className="flex w-full flex-col">
            {verbs.map(({ word, rest, indent, accent }, index) => (
              <span
                key={word}
                className="flex items-end gap-[2.5cqi]"
                style={{ paddingLeft: indent }}
              >
                <span
                  className={
                    accent
                      ? "-rotate-2 font-[family-name:var(--font-display)] text-[25cqi] font-black italic leading-[0.9] tracking-[-0.03em] text-accent"
                      : "text-[22cqi] font-black leading-[0.86] tracking-[-0.075em]"
                  }
                >
                  {word}
                </span>
                <span className="mb-[2cqi] max-w-[18cqi] text-[clamp(11px,1.9cqi,15px)] font-extrabold uppercase leading-[1.15] tracking-[0.12em]">
                  <span className="block font-mono text-accent" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {rest}
                </span>
              </span>
            ))}
          </h2>
        </div>
        <div className="grid">
          <CinemaGrid />
        </div>
      </section>
      <section
        id="the-experience"
        className="mx-auto grid min-h-[350px] max-w-[1600px] grid-cols-[1fr_0.38fr] max-lg:grid-cols-[1fr_0.48fr] max-sm:grid-cols-1"
        aria-label="The Paradiso experience"
      >
        <JuryReveal />
        <div className="flex flex-col items-start justify-between bg-surface px-9 py-8 [&>p]:my-4.5 [&>p]:text-[clamp(30px,3vw,48px)] [&>p]:font-medium [&>p]:leading-[1.08] [&>p]:tracking-[-0.05em] [&>p_em]:font-serif [&>p_em]:font-normal max-lg:p-6 max-sm:gap-5 max-sm:p-6 max-sm:[&>p]:m-0 max-sm:[&>p]:text-4xl">
          <Asterisk
            className="-ml-2 text-accent max-sm:hidden"
            size={56}
            strokeWidth={1}
            aria-hidden="true"
          />
          <p>
            Some ideas
            <br />
            are better
            <br />
            <em>shared.</em>
          </p>
          <Link href="/rooms" className="inline-flex items-center gap-5 border-b border-line pb-2 text-[15px] font-semibold [&>svg]:transition-transform hover:[&>svg]:translate-x-0.5 hover:[&>svg]:-translate-y-0.5">
            Find your room <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 py-8 text-sm font-medium text-muted max-sm:items-start max-sm:gap-5">
        <span>
          Paradiso <span className="px-3 text-muted">/</span> For the love
          of cinema.
        </span>
        <a href="#landing" className="inline-flex items-center gap-2 [&>svg]:rotate-180">
          Back to the opening <ArrowDown size={14} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
