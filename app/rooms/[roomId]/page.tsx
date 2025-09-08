

import SearchParamsSetterWrapper from '@/components/utils/SearchParamsSetterWrapper';
import { RoomsServices } from '@/services/rooms';
import { Button } from '@heroui/button';
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


    return (
        <div>
            <TableOperators />

            <Suspense key={Object.values(searchParamsObject).join('')}>
                <RoomFetcher roomId={roomId} searchParams={await searchParams} />
            </Suspense>
            <Suspense key={addModalParam}>
                {addModalParam === 'true' && <AddMovieModal roomId={roomId} />}
                {/* {voteModalParam === 'true' && <AddMovieModal roomId={roomId} />} */}
            </Suspense>
        </div >
    );
}

async function RoomFetcher({ searchParams, roomId, }: { searchParams: { [key: string]: string }, roomId: string, }) {
    const { result } = await new RoomsServices().getRoomRatings(Number(roomId),
        { ...searchParams });

    const movies = result?.data || [];
    return <RatingTable ratings={movies} />;
}
