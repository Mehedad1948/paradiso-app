import { RoomsServices } from '@/services/rooms';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import RatingTable from './table';
import AddMovieModal from './AddMovieModal';
import { UserType } from '@/types';

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
            <Link className='mb-4 block ' href={`/rooms/${roomId}?add-movie-modal=true`}>
                <Button color='secondary'>Add Movie</Button>
            </Link>
            <Suspense key={Object.values(searchParamsObject).join('')}>
                <RoomFetcher roomId={roomId} searchParams={await searchParams} />
            </Suspense>
            <Suspense key={addModalParam}>
                {addModalParam === 'true' && <AddMovieModal roomId={roomId} />}
                {voteModalParam === 'true' && <AddMovieModal roomId={roomId} />}
            </Suspense>
        </div>
    );
}

async function RoomFetcher({ searchParams, roomId, }: { searchParams: { [key: string]: string }, roomId: string, }) {
    const { result } = await new RoomsServices().getRoomById(Number(roomId));
    const users = result?.users || [];
    return <RatingsFetcher roomId={roomId} searchParams={await searchParams} users={users} />;
}

async function RatingsFetcher({ searchParams, roomId, users }: { searchParams: { [key: string]: string }, roomId: string, users: UserType[] }) {
    const { result } = await new RoomsServices().getRoomRatings(Number(roomId));
    const movies = result?.data || [];
    return <RatingTable users={users} ratings={movies} />;
}