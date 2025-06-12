'use client'
import { UserType } from '@/types';
import { MovieWithRatings } from '@/types/ratings';
import {
    getKeyValue,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/table";

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
    }))];

    const rows = ratings.map((rating) => ({
        title: { title: rating.title, image: rating.poster_path },
        users: users.reduce((acc, user) => {
            if (user.id) {
                acc[user.id] =
                    rating.ratings.find((r) => r.user.id === user.id)?.rate ?? 'No rating';
            }
            return acc;
        }, {} as Record<string, number | string>),
    }));

    console.log(rows, columns);


    return (
        <Table aria-label="Movies with Ratings table">
            <TableHeader columns={columns}>
                {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={rows}>
                {(item) => (
                    <TableRow key={item.title.title}>
                        <TableCell className=' grid grid-cols-[36px,_1fr]'>
                            <img src={process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL + item.title.image} alt={item.title.title} />
                            <span>{item.title.title}</span>
                        </TableCell>
                        {Object.entries(item.users).map(([userId, rating]) => (
                            <TableCell key={userId}>
                                {rating}
                            </TableCell>
                        ))}
                    </TableRow>
                )}
            </TableBody>
        </Table>

    );
}