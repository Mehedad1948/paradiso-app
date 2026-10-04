import roomInviteLinksService from "@/services/rooms/room-invite-link.service";
import InvitationCard from "./Threejs";
import { Suspense } from "react";
import Link from "next/link";

export default function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mb-10 mt-[120px] max-w-[700px] px-6 py-10 [&_h1]:mb-5 [&_h1]:text-[clamp(32px,5vw,52px)] [&_h2]:mb-5 [&_h2]:text-[clamp(32px,5vw,52px)] [&_p]:mb-7 [&_p]:text-muted [&_a]:inline-flex [&_a]:items-center [&_a]:rounded-md [&_a]:bg-ink [&_a]:px-5 [&_a]:py-3 [&_a]:font-semibold [&_a]:text-canvas [&_button]:inline-flex [&_button]:items-center [&_button]:rounded-md [&_button]:bg-ink [&_button]:px-5 [&_button]:py-3 [&_button]:font-semibold [&_button]:text-canvas">
          <p role="status">Opening your invitation…</p>
        </div>
      }
    >
      <InvitationContent params={params} />
    </Suspense>
  );
}

async function InvitationContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { result, response } = await roomInviteLinksService.tokenInfo(token);
  if (!response.ok || !result)
    return (
      <div className="mx-auto mb-10 mt-[120px] max-w-[700px] px-6 py-10 [&_h1]:mb-5 [&_h1]:text-[clamp(32px,5vw,52px)] [&_h2]:mb-5 [&_h2]:text-[clamp(32px,5vw,52px)] [&_p]:mb-7 [&_p]:text-muted [&_a]:inline-flex [&_a]:items-center [&_a]:rounded-md [&_a]:bg-ink [&_a]:px-5 [&_a]:py-3 [&_a]:font-semibold [&_a]:text-canvas [&_button]:inline-flex [&_button]:items-center [&_button]:rounded-md [&_button]:bg-ink [&_button]:px-5 [&_button]:py-3 [&_button]:font-semibold [&_button]:text-canvas" role="alert">
        <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.09em] text-accent">An invitation to cinema</p>
        <h1>This invitation is unavailable.</h1>
        <p>
          It may have expired. Ask the room’s host for a fresh link, or explore
          your rooms.
        </p>
        <Link href="/rooms">Go to dashboard</Link>
      </div>
    );

  const { inviter, room } = result;

  return (
    <div>
      <InvitationCard
        roomImage={
          room.image ? `${process.env.AWS_BASE_URL}${room.image}` : undefined
        }
        inviterAvatar={inviter?.avatar ?? undefined}
        inviterName={inviter?.name}
        roomName={room.name}
      />
      {/* {room.image && <Image
            className='rounded-2xl'
                alt=''
                width={500}
                height={500}
                src={`${process.env.AWS_BASE_URL}${room.image}`}
            />} */}
    </div>
  );
}
