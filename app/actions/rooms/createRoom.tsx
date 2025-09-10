"use server";

import roomsServices from '@/services/rooms';
import { CreateRoomInputs } from '@/types/rooms';
;

export async function createRoom(data: CreateRoomInputs) {
    const res = await roomsServices.createRoom(data);
    return res;
}
