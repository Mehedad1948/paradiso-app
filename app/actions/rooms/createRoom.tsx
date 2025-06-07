"use server";

import { RoomsServices } from '@/services/rooms';
import { CreateRoomInputs } from '@/types/rooms';
import { formatResponse } from "@/utils/formatResponse";

export async function createRoom(data: CreateRoomInputs) {
    const res = await new RoomsServices().createRoom(data);
    return formatResponse(res);
}
