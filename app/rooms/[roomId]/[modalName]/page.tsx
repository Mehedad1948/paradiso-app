
import { RatingServices } from '@/services/ratings';
import { MovieWithRatings } from '@/types/ratings';
import RatingTable from './table';
import { Button } from '@heroui/button';
import Link from 'next/link';
import AddMovieModal from './AddMovieModal';
import { Suspense } from 'react';



export default async function page({ params }: { params: Promise<{ roomId: string, modalName: string[] | undefined }> }) {
    const { modalName, roomId } = await params;
    const { result, response } = await new RatingServices().getAllRatings()

    let ratings = result?.movies.data
    return (
        <div>
            <Link href={`/room/add-movie-modal`}>
                <Button color='secondary'>Add Movie</Button>
            </Link>
            <Suspense>
                {ratings && <RatingTable users={result?.users || []} ratings={ratings} />}
            </Suspense>
            <Suspense key={modalName?.join(', ')}>
                {modalName?.includes('add-movie-modal') && <AddMovieModal />}
            </Suspense>
        </div>
    );
}