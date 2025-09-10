'use server'

import roomsServices from '@/services/rooms'

export async function removeMovieFromRoom({ roomId, movieId }: { roomId: string, movieId: string }) {
    const res = await roomsServices.deleteMovie({ roomId, movieId })
    return res

}