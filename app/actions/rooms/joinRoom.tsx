"use server";

import roomsServices from '@/services/rooms';
import { JoinRoomInputs } from '@/types/rooms';
;

export async function joinRoom(data: JoinRoomInputs) {
    const res = await roomsServices.joinRoom(data);
    return res;
}
