'use client'
import useSetSearchParams from '@/hooks/useSetSearchParams';
import { MovieWithRatings } from '@/types/ratings';
import { Alert } from '@heroui/alert';
import { Button } from '@heroui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/table";
import { ChevronDown } from 'lucide-react';
import { use, useState } from 'react';
import VoteMovieModal from './VoteMovieModal';
import SearchParamsSetterWrapper from '@/components/utils/SearchParamsSetterWrapper';
import DeleteMovieFromRoomModal from './DeleteMovieFromRoomModal';
import roomsServices from '@/services/rooms';
import { useUserStore } from '@/store/user';
import TableBottomContent from './components/TableBottomCotnent';

export default function RatingTable({ roomPromises }:
    {
        roomPromises:
        Promise<[
            Awaited<ReturnType<typeof roomsServices.getRoomRatings>>,
            Awaited<ReturnType<typeof roomsServices.getRoomById>>
        ]>,


    }) {
    const [{ result }, { result: roomDetails }] = use(roomPromises)


    const { user } = useUserStore()
    const ratings = result?.data
    const columns = [{
        label: `TITLE (${result?.meta.totalItems})`,
        key: 'title',
        isUser: false
    },
    //  {
    //     label: 'IMDB RATE',
    //     key: 'imdbRate'
    // },
    ...(ratings?.length ? ratings[0]?.ratings.map(({ user }) => ({
        label: user.username,
        key: user.id,
        isUser: true
    })) : []),
    {
        label: 'ACTION',
        key: 'action',
        isUser: false
    }
    ];

    const { setSearchParam, params } = useSetSearchParams()


    const [movieToVote, setMovieToVote] = useState<null | MovieWithRatings>(null)

    const [deletingMovie, setDeletingMovie] = useState<MovieWithRatings | null>(null)

   


    return (
        <>
            {<Table bottomContent={<TableBottomContent  pages={result?.meta.totalPages || 0} />} bottomContentPlacement="outside" aria-label="Movies with Ratings table">
                <TableHeader columns={columns}>
                    {
                        (column) => <TableColumn key={column.key}>
                            {column.isUser ?
                                <Button
                                    onPress={() => setSearchParam([{ sortByUserId: column.key, sortBy: 'userRate' }])}
                                    variant='light'
                                    endContent={<ChevronDown className='w-4' />}
                                >
                                    {column.label}
                                </Button> : column.label}
                        </TableColumn>
                    }
                </TableHeader>
                {ratings?.length ? <TableBody items={ratings}>
                    {(item) => (
                        <TableRow className='items-center' key={item.title}>
                            <TableCell className=' grid grid-cols-[36px,_1fr] items-center gap-3'>
                                <img
                                    src={process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL + 'w500' + item.poster_path}
                                    alt={item.title}
                                    className='rounded-lg'
                                />
                                <span className=' text-base'>{item.title}</span>
                            </TableCell>
                            {item.ratings.map(({ user, rate }) => (
                                <TableCell key={user.id}>
                                    {rate || 'Not Voted'}
                                </TableCell>
                            ))}
                            <TableCell className=' '>
                                <div className='flex items-center gap-4'>
                                    {<Button onPress={() => setMovieToVote(item)} color='secondary' size='sm'>
                                        Vote
                                    </Button>}

                                    {(user?.role === 'admin' || roomDetails?.owner.id === user?.id || item.addedBy.id === user?.id)
                                        && <SearchParamsSetterWrapper
                                            className='block'
                                            keyValue={{ 'delete-movie-modal': 'true', 'movie-id': item.id }}
                                        >
                                            <Button onPress={() => setDeletingMovie(item)} size='sm' className='w-fit' color='danger'>
                                                Delete
                                            </Button>
                                        </SearchParamsSetterWrapper>}
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody> :
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Alert color='primary'> No movies has been added yet</Alert>
                            </TableCell>
                            <TableCell>
                                <span></span>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                }
            </Table >}
            {movieToVote &&
                <VoteMovieModal movie={movieToVote} onClose={() => setMovieToVote(null)} />
            }
            {deletingMovie && <DeleteMovieFromRoomModal movie={deletingMovie}
                onClose={() => setDeletingMovie(null)} />}
        </>
    );
}