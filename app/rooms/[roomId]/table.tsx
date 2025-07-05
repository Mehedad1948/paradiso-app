'use client'
import { UserType } from '@/types';
import { MovieWithRatings } from '@/types/ratings';
import { Button } from '@heroui/button';
import { Modal, ModalBody, ModalContent, ModalFooter } from '@heroui/modal';
import {
    getKeyValue,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/table";
import Image from 'next/image';
import { useState } from 'react';
import AddMovieModal from './AddMovieModal';
import VoteMovieModal from './VoteMovieModal';

export default function RatingTable({ ratings, users }: { ratings: MovieWithRatings[], users: UserType[] }) {
    const columns = [{
        label: 'TITLE',
        key: 'title'
    },
    //  {
    //     label: 'IMDB RATE',
    //     key: 'imdbRate'
    // },
    ...users.map(user => ({
        label: user.username,
        key: `ratings.${user.id}`
    })),
    {
        label: 'ACTION',
        key: 'action'
    }
    ];

    const rows = ratings.map((rating) => ({
        ...rating,
        users: users.reduce((acc, user) => {
            if (user.id) {
                acc[user.id] =
                    rating.ratings.find((r) => r.user.id === user.id)?.rate ?? 'No rating';
            }
            return acc;
        }, {} as Record<string, number | string>),
    }));

    const [movieToVote, setMovieToVote] = useState<null | MovieWithRatings>(null)


    return (
        <>
            <Table aria-label="Movies with Ratings table">
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={rows}>
                    {(item) => (
                        <TableRow key={item.title}>
                            <TableCell className=' grid grid-cols-[36px,_1fr]'>
                                <img src={process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL + item.poster_path} alt={item.title} />
                                <span>{item.title}</span>
                            </TableCell>
                            {Object.entries(item.users).map(([userId, rating]) => (
                                <TableCell key={userId}>
                                    {rating}
                                </TableCell>
                            ))}
                            <TableCell className=' grid grid-cols-[36px,_1fr]'>
                                {!item.hasVoted && <Button onPress={() => setMovieToVote(item)} color='secondary' size='sm'>
                                    Vote
                                </Button>}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table >
            {movieToVote &&
                <VoteMovieModal movie={movieToVote} onClose={() => setMovieToVote(null)} />
            }
        </>
    );
}