import { RoomsServices } from '@/services/rooms';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import RatingTable from './table';
import AddMovieModal from './AddMovieModal';
import { UserType } from '@/types';

export default async function page({ params, searchParams }: {
    params: Promise<{ roomId: string }>,
    searchParams: Promise<{ 'add-movie-modal': string }>
},
) {
    console.log(await params);

    const roomId = (await params).roomId;
    const modalName = (await searchParams)['add-movie-modal'];
    const { result } = await new RoomsServices().getRoomById(Number(roomId));

    const movies = result?.movies || [];

    return (
        <div>
            <Link className='mb-4 block ' href={`/rooms/${roomId}?add-movie-modal=true`}>
                <Button color='secondary'>Add Movie</Button>
            </Link>
            <Suspense>
                <RatingsFetcher users={result?.users || []} searchParams={await searchParams} roomId={roomId} />
            </Suspense>
            <Suspense key={modalName}>
                {modalName === 'true' && <AddMovieModal roomId={roomId} />}
            </Suspense>
        </div>
    );
}

async function RatingsFetcher({ searchParams, roomId, users }: { searchParams: { [key: string]: string }, roomId: string, users: UserType[] }) {
    const { result } = await new RoomsServices().getRoomRatings(Number(roomId));
    const movies = result?.data || [];
    return <RatingTable users={users} ratings={movies} />;
}