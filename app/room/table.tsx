'use client'
import { MovieWithRatings } from '@/types/ratings';
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/table";

export default function RatingTable({ ratings }: { ratings: MovieWithRatings[] }) {
    return (
        <Table aria-label="Movies with Ratings table">
            <TableHeader>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>IMDB RATE</TableColumn>
                <TableColumn>USER RATINGS</TableColumn>
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
                                            <strong>{rating.user.username}</strong>: {rating.rate}/10
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