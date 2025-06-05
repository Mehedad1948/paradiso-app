
import { RatingServices } from '@/services/ratings';
import RatingTable from './table';
import { MovieWithRatings } from '@/types/ratings';



export default async function page() {
    const { result, response } = await new RatingServices().getAllRatings()
    console.log('🚀🚀🚀', result);

    let ratings = result?.movies.data
    return (
        <div>
            {ratings && <RatingTable users={result?.users || []} ratings={ratings} />}
        </div>
    );
}