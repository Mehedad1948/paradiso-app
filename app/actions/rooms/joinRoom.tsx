"use server";

import { RoomsServices } from '@/services/rooms';
import { JoinRoomInputs } from '@/types/rooms';
import { formatResponse } from "@/utils/formatResponse";

export async function joinRoom(data: JoinRoomInputs) {
    const res = await new RoomsServices().joinRoom(data);
    return formatResponse(res);
}
