'use server'

import { NEXT_TAGS } from '@/constants/tags'
import roomsServices from '@/services/rooms'
import { revalidateTag } from 'next/cache'

export async function removeMovieFromRoom({ roomId, movieId }: { roomId: string, movieId: string }) {
    const res = await roomsServices.deleteMovie({ roomId, movieId })
    if (res.response.ok) {
        revalidateTag(`${NEXT_TAGS.ROOM_RATINGS}-${roomId}`)
    }

    return res

}