"use client";
import Image from "next/image";
import { ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import ResponsiveDialog from "@/components/ui/ResponsiveDialog";
import { posters } from "@/config/posters";
import AuthFlow from "./AuthFlow";

/**
 * The sign-in dialog: a modal beside a poster panel on desktop, a bottom sheet on phones. Only
 * ever loaded through `AuthGateProvider`, which keeps it out of the main bundle.
 */
export default function AuthDialog({
  isOpen,
  reason,
  initialView,
  onClose,
}: {
  isOpen: boolean;
  reason?: string;
  initialView: "sign-in" | "register";
  onClose: () => void;
}) {
  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
      className="overflow-hidden border border-line bg-elevated text-ink shadow-[0_40px_120px_-20px_rgb(0_0_0_/_60%)] md:rounded-[28px]"
      drawerClassName="rounded-t-[28px] border-b-0"
    >
      <ModalContent>
        <ModalHeader className="sr-only">Sign in to Paradiso</ModalHeader>
        <ModalBody className="gap-0 p-0 md:grid md:grid-cols-[0.85fr_1.15fr]">
          <aside
            aria-hidden="true"
            className="relative hidden min-h-[560px] flex-col justify-end overflow-hidden bg-surface p-9 md:flex"
          >
            <div className="absolute inset-x-0 top-8 h-[250px] [&>img]:absolute [&>img]:h-auto [&>img]:w-[44%] [&>img]:shadow-[0_16px_32px_rgb(0_0_0_/_18%)]">
              <Image
                src={posters.vertigo}
                alt=""
                width={280}
                height={420}
                sizes="160px"
                className="left-[8%] top-5 -rotate-12"
              />
              <Image
                src={posters.arrival}
                alt=""
                width={280}
                height={420}
                sizes="160px"
                className="right-[6%] top-1.5 rotate-[10deg]"
              />
            </div>
            <h2 className="relative pt-[250px] text-[clamp(30px,3.4vw,44px)] font-semibold leading-[1.04] tracking-[-0.06em]">
              Your next
              <br />
              great story
              <br />
              <em className="font-serif font-normal">starts here.</em>
            </h2>
          </aside>
          <div className="px-5 pb-9 pt-8 md:px-10 md:py-12">
            <AuthFlow initialView={initialView} reason={reason} />
          </div>
        </ModalBody>
      </ModalContent>
    </ResponsiveDialog>
  );
}
