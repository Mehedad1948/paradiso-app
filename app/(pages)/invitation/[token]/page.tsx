

import roomInviteLinksService from '@/services/rooms/room-invite-link.service';
import Image from 'next/image';
import InvitationCard from './Threejs';

export default async function page({ params }: { params: { token: string } }) {
    const { result, response } = await roomInviteLinksService.tokenInfo(params.token)

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