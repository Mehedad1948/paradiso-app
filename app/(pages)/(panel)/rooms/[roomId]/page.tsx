import roomsServices from '@/services/rooms';
import { Suspense } from 'react';
import AddMovieModal from './AddMovieModal';
import RatingTable from './table';
import TableOperators from './TableOperators';
import InvitationsModal from './InvitationsModal';

export default async function page({ params, searchParams }: {
    params: Promise<{ roomId: string }>,
    searchParams: Promise<{ [key: string]: string }>
},
) {

    const roomId = (await params).roomId;

    const searchParamsObject = await searchParams


    const invitations = roomsServices.invitations(roomId)

    const ratingsPromise = roomsServices.getRoomRatings(Number(roomId),
        { ...searchParamsObject })

    const roomDetailsPromise = roomsServices.getRoomById(Number(roomId))

    const roomPromises = Promise.all([ratingsPromise, roomDetailsPromise])

    return (
        <div>
            <TableOperators />

            <Suspense key={Object.values(searchParamsObject).join('')}>
                <RatingTable roomPromises={roomPromises} />
            </Suspense>

            <AddMovieModal roomId={roomId} />

            <InvitationsModal invitationsPromise={invitations} roomId={roomId} />

        </div >
    );
}
