

import roomsServices from '@/services/rooms';
import { Suspense } from 'react';
import AddMovieModal from './AddMovieModal';
import RatingTable from './table';
import TableOperators from './TableOperators';

export default async function page({ params, searchParams }: {
    params: Promise<{ roomId: string }>,
    searchParams: Promise<{ [key: string]: string }>
},
) {

    const roomId = (await params).roomId;
    const addModalParam = (await searchParams)['add-movie-modal'];
    const voteModalParam = (await searchParams)['vote-movie-modal'];

    const searchParamsObject = await searchParams

    if ('add-movie-modal' in searchParamsObject) {
        delete searchParamsObject['add-movie-modal'];
    }

    const invitations = roomsServices.invitations(roomId)


    return (
        <div>
            <TableOperators invitationsPromise={invitations} />

            <Suspense key={Object.values(searchParamsObject).join('')}>
                <RoomFetcher roomId={roomId} searchParams={await searchParams} />
            </Suspense>

            <AddMovieModal roomId={roomId} />

        </div >
    );
}

async function RoomFetcher({ searchParams, roomId, }: { searchParams: { [key: string]: string }, roomId: string, }) {
    const { result } = await roomsServices.getRoomRatings(Number(roomId),
        { ...searchParams });

    const movies = result?.data || [];
    return <RatingTable ratings={movies} />;
}
