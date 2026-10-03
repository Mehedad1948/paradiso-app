import { type ReactNode, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Asterisk, ArrowLeft } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { posters } from "@/config/posters";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-canvas px-[4.5vw] pb-10 text-ink max-md:px-[5vw]">
      <nav className="mx-auto mb-7 flex min-h-[88px] max-w-[1440px] items-center justify-between border-b border-line max-md:mb-6" aria-label="Account navigation">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-semibold tracking-[-0.075em] [&>svg]:text-accent" aria-label="Paradiso home">
          <Asterisk size={25} aria-hidden="true" /> paradiso
        </Link>
        <ThemeSwitch />
      </nav>
      <div className="mx-auto grid min-h-[calc(100svh-160px)] max-w-[1440px] grid-cols-2 overflow-hidden rounded-[10px] border border-line max-md:min-h-0 max-md:grid-cols-1">
        <aside className="relative flex min-h-[660px] flex-col justify-end overflow-hidden bg-surface p-11 max-lg:p-8 max-md:hidden" aria-label="For the love of cinema">
          <div className="absolute left-0 top-6 h-[330px] w-full [&>img]:absolute [&>img]:h-auto [&>img]:w-[40%] [&>img]:shadow-[0_16px_32px_rgb(0_0_0_/_18%)]" aria-hidden="true">
            <Image
              src={posters.vertigo}
              alt=""
              width={280}
              height={420}
              sizes="28vw"
              className="left-[13%] top-5 -rotate-12"
            />
            <Image
              src={posters.arrival}
              alt=""
              width={280}
              height={420}
              sizes="28vw"
              className="right-[8%] top-1.5 rotate-[10deg]"
            />
          </div>
          <div className="relative z-[1] pt-[330px] [&>h2]:text-[clamp(40px,4.8vw,70px)] [&>h2]:font-semibold [&>h2]:leading-[1.04] [&>h2]:tracking-[-0.06em] [&>h2_em]:font-serif [&>h2_em]:font-normal [&>p]:mt-5 [&>p]:text-base [&>p]:text-muted">
            <h2>
              Your next
              <br />
              great story
              <br />
              <em>starts here.</em>
            </h2>
            <p>Good films. Better company.</p>
          </div>
        </aside>
        <div className="flex min-w-0 items-center bg-elevated p-12 max-lg:p-8 max-md:px-5 max-md:pb-9 max-md:pt-7">
          <div className="mx-auto w-full max-w-[430px] [&_h1]:mb-3 [&_h1]:text-[clamp(32px,3vw,44px)] [&_h1]:tracking-[-0.05em] [&_.text-sm]:text-[15px] [&_form]:gap-5 [&_button]:font-semibold [&_[data-slot=input-wrapper]]:border [&_[data-slot=input-wrapper]]:border-line [&_[data-slot=input-wrapper]]:bg-surface [&_[data-slot=input-wrapper]]:shadow-none">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-[15px] text-muted hover:text-accent">
              <ArrowLeft size={18} aria-hidden="true" /> Back to Paradiso
            </Link>
            <Suspense fallback={<p role="status">Loading your account…</p>}>
              {children}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
