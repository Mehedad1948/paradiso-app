

import roomInviteLinksService from '@/services/rooms/room-invite-link.service';
import InvitationCard from './Threejs';
import { Suspense } from 'react';

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
    return <Suspense fallback={<p>Loading invitation…</p>}><InvitationContent params={params} /></Suspense>;
}

async function InvitationContent({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const { result, response } = await roomInviteLinksService.tokenInfo(token)
    if (!response.ok || !result) return <p role="alert">This invitation is unavailable.</p>;

    const { inviter, canJoin, message, room } = result;


    return (
        <div className=' mx-auto flex items-center flex-col max-h-dvh max-w-dvw overflow-hidden'>
            <InvitationCard roomImage={`${process.env.AWS_BASE_URL}${room.image}`} inviterAvatar={inviter?.avatar} inviterName={inviter?.name} roomName={room.name} />
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
