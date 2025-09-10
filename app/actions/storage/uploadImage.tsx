"use server";

import storageServices from '@/services/storage';
;

export async function uploadImage(file: File, folder: string) {
    const res = await storageServices.uploadImage(file, folder);
    return res;
}
