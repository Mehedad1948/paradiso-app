"use client";
import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { panelApi } from "@/lib/api/panel";
import { BffError } from "@/lib/api/client";
import { authHref } from "@/lib/auth/redirect";
import InvitationCard from "./Threejs";

type Props = Omit<
  ComponentProps<typeof InvitationCard>,
  "onAccept" | "onDecline" | "isPending" | "error"
> & {
  token: string;
  roomId: number;
  /** Set when the visitor has no valid session; null when already signed in. */
  signInHref: string | null;
};

export default function AcceptInvitation({
  token,
  roomId,
  signInHref,
  ...card
}: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const origin = `/invitation/${encodeURIComponent(token)}`;

  const accept = async () => {
    // Guests sign in (or register) first; the auth pages return them to this invitation.
    if (signInHref) return window.location.assign(signInHref);
    setIsPending(true);
    setError("");
    try {
      const { room } = await panelApi.acceptInvite(token);
      router.push(`/rooms/${room.id}`);
    } catch (cause) {
      if (cause instanceof BffError && cause.status === 401)
        // The session expired after the page loaded: renew it, then come back.
        return window.location.assign(
          authHref("sign-in", { origin, refresh: "true" }),
        );
      if (cause instanceof BffError && cause.status === 409)
        // Already a member of this room.
        return router.push(`/rooms/${roomId}`);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not accept the invitation. Please try again.",
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
