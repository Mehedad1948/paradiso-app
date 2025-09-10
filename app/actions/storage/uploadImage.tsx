"use server";

import storageServices from '@/services/storage';
import { formatResponse } from "@/utils/formatResponse";

export async function uploadImage(file: File, folder: string) {
    const res = await storageServices.uploadImage(file, folder);
    return formatResponse(res);
}
