'use client'
import { UserType } from '@/types';
import { MovieWithRatings } from '@/types/ratings';
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/table";

export default function RatingTable({ ratings, users }: { ratings: MovieWithRatings[], users: UserType[] }) {
    return (
        <Table aria-label="Movies with Ratings table">
            <TableHeader>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>IMDB RATE</TableColumn>
                {users.map(user => <TableColumn key={user.id}>
                    {user.username}
                </TableColumn>)}
            </TableHeader>
            <TableBody>
                {ratings.map((movie) => (
                    <TableRow key={movie.id}>
                        <TableCell>{movie.title}</TableCell>
                        <TableCell>{movie.imdbRate ?? 'N/A'}</TableCell>
                        <TableCell>
                            {movie.ratings.length === 0 ? (
                                'No ratings'
                            ) : (
                                <ul className="space-y-1">
                                    {movie.ratings.map((rating, idx) => (
                                        <li key={idx}>
                                            {rating.rate}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

    );
}