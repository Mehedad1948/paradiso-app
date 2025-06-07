"use server";

import { StorageServices } from '@/services/storage';
import { formatResponse } from "@/utils/formatResponse";

export async function uploadImage(file: File, folder: string) {
    const res = await new StorageServices().uploadImage(file, folder);
    return formatResponse(res);
}
