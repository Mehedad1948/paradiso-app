import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import ParadisoWordmark from "@/components/landing/ParadisoWordmark";
import CinemaGrid from "@/components/landing/CinemaGrid";
import styles from "@/components/landing/CinemaHero.module.css";

export const metadata: Metadata = {
  title: { absolute: "Paradiso — cinema for your circle" },
  description:
    "Find your next favorite film, gather your people, and make a night of it with Paradiso.",
};

export default async function Home() {
  "use cache";
  cacheLife("hours");

  return (
    <div className="min-h-svh bg-canvas px-[4.5vw] pb-0 pt-28 text-ink max-sm:px-[5vw] max-sm:pt-28 max-[480px]:pt-36">
      <section
        id="landing"
        className="mx-auto max-w-[1600px] scroll-mt-32"
        aria-labelledby="landing-title"
      >
        <h1 id="landing-title" className="sr-only">
          Paradiso — cinema for your circle
        </h1>
        <div className={styles.hero}>
          <ParadisoWordmark />
          <CinemaGrid />
        </div>
        <div className="flex items-end justify-between gap-10 pb-14 pt-12 [&>h2]:text-[clamp(38px,4.2vw,68px)] [&>h2]:font-semibold [&>h2]:leading-[1.08] [&>h2]:tracking-[-0.065em] [&>h2_span]:font-serif [&>h2_span]:font-normal [&>h2_span]:italic [&>h2_span]:tracking-[-0.045em] max-sm:flex-col max-sm:items-start max-sm:gap-6 max-sm:pb-9 max-sm:pt-8 max-sm:[&>h2]:text-[clamp(34px,10.8vw,48px)]">
          <h2>
            Good films.
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
        id="the-experience"
        className="mx-auto grid min-h-[350px] max-w-[1600px] grid-cols-[1fr_0.38fr] max-lg:grid-cols-[1fr_0.48fr] max-sm:grid-cols-1"
        aria-label="The Paradiso experience"
      >
        <div className="group relative min-h-[350px] overflow-hidden bg-media after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-b after:from-transparent after:from-40% after:to-black/75 max-sm:min-h-[280px]">
          <Image
            src="/12-angry.jpg"
            alt="A scene from 12 Angry Men, with the jury gathered around a table"
            fill
            sizes="(max-width: 700px) 100vw, 70vw"
            className="object-cover object-[center_40%] transition-transform duration-1000 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
          />
        </div>
        <div className="flex flex-col items-start justify-between bg-surface px-9 py-8 [&>p]:my-4.5 [&>p]:text-[clamp(30px,3vw,48px)] [&>p]:font-medium [&>p]:leading-[1.08] [&>p]:tracking-[-0.05em] [&>p_em]:font-serif [&>p_em]:font-normal max-lg:p-6 max-sm:gap-5 max-sm:p-6 max-sm:[&>p]:m-0 max-sm:[&>p]:text-4xl">
          <Asterisk
            className="-ml-2 text-accent max-sm:hidden"
            size={56}
            strokeWidth={1}
            aria-hidden="true"
          />
          <p>
            Some things
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
