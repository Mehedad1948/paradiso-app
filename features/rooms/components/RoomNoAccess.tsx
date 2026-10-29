import Link from "next/link";
import { ArrowLeftIcon, LockIcon, MagnifierCloseIcon } from "@solar-icons/react/linear";
import { BffError } from "@/lib/api/client";
import { authHref } from "@/lib/auth/redirect";

type Props = { status: number; origin: string };

const COPY: Record<number, { title: string; body: string }> = {
  401: {
    title: "Sign in to view this room",
    body: "This room is private. Sign in with an account that is a member to see it.",
  },
  403: {
    title: "You don't have access to this room",
    body: "This room is private, or you're no longer able to view it. Ask a member for an invitation.",
  },
  404: {
    title: "Room not found",
    body: "This room doesn't exist, or it's private and you don't have access to it.",
  },
};

/** Room errors that mean "you can't see this room", as opposed to a failed request. */
export function isRoomAccessError(error: unknown): error is BffError {
  return (
    error instanceof BffError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  );
}

export default function RoomNoAccess({ status, origin }: Props) {
  const { title, body } = COPY[status] ?? COPY[403];
  const Icon = status === 404 ? MagnifierCloseIcon : LockIcon;
  return (
    <div role="alert" className="mx-auto flex max-w-[480px] flex-col items-center gap-4 py-24 text-center">
      <Icon size={40} aria-hidden="true" className="text-muted" />
      <h1 className="text-[28px] tracking-[-0.04em]">{title}</h1>
      <p className="text-base text-muted">{body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {status === 401 && (
          <Link
            href={authHref("sign-in", { origin, refresh: "true", reason: "session-expired" })}
            className="rounded-md bg-ink px-5 py-3 text-[15px] font-semibold text-canvas"
          >
            Sign in
          </Link>
        )}
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 rounded-md border border-line px-5 py-3 text-[15px] font-semibold"
        >
          <ArrowLeftIcon size={18} aria-hidden="true" /> All rooms
        </Link>
      </div>
    </div>
  );
}
