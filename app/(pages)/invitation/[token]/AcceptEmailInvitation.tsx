"use client";
import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { panelApi } from "@/lib/api/panel";
import { BffError } from "@/lib/api/client";
import InvitationCard from "./Threejs";

type Props = Omit<
  ComponentProps<typeof InvitationCard>,
  "onAccept" | "onDecline" | "isPending" | "error"
> & {
  token: string;
  /** Set when the visitor has no valid session; null when already signed in. */
  signInHref: string | null;
};

const messageFor = (status: number) => {
  switch (status) {
    case 401:
      return "This invitation has expired. Ask the host to send a new one.";
    case 403:
      return "Sign in with the email address that received this invitation, and make sure it is verified.";
    case 404:
      return "Invitation not found.";
    case 409:
      return "This invitation is no longer active.";
    default:
      return "Could not accept the invitation. Please try again.";
  }
};

export default function AcceptEmailInvitation({
  token,
  signInHref,
  ...card
}: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const accept = async () => {
    // Guests sign in (or register) first; the auth pages return them to this invitation.
    if (signInHref) return window.location.assign(signInHref);
    setIsPending(true);
    setError("");
    try {
      const { roomId } = await panelApi.acceptEmailInvite(token);
      // Also covers the "Invitation already accepted" message.
      router.replace(`/rooms/${roomId}`);
    } catch (cause) {
      // 401 means the invitation token is invalid or expired (not the session).
      setError(
        cause instanceof BffError && cause.status > 0
          ? messageFor(cause.status)
          : cause instanceof Error
            ? cause.message
            : messageFor(0),
      );
      setIsPending(false);
    }
  };

  return (
    <InvitationCard
      {...card}
      isPending={isPending}
      error={error}
      onAccept={accept}
      onDecline={() => router.push("/")}
    />
  );
}
