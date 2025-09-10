

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


    return (
        <div>
            <TableOperators  />

            <Suspense key={Object.values(searchParamsObject).join('')}>
                <RoomFetcher roomId={roomId} searchParams={await searchParams} />
            </Suspense>

            <AddMovieModal roomId={roomId} />

            <InvitationsModal invitationsPromise={invitations} roomId={roomId}  />

        </div >
    );
}

async function RoomFetcher({ searchParams, roomId, }: { searchParams: { [key: string]: string }, roomId: string, }) {
    const { result } = await roomsServices.getRoomRatings(Number(roomId),
        { ...searchParams });

    const movies = result?.data || [];
    return <RatingTable ratings={movies} />;
}
