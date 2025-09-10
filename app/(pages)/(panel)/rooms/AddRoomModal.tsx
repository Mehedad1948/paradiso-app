'use client'

import useSetSearchParams from '@/hooks/useSetSearchParams';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createRoom } from '../../../actions/rooms/createRoom';
import { addToast } from '@heroui/toast';
import { Input, Textarea } from '@heroui/input';
import { Switch } from '@heroui/switch';

import { useState } from 'react';
import { uploadImage } from '../../../actions/storage/uploadImage';

export default function AddRoomModal() {
    const { setSearchParam, params: { addRoomModal }, removeQuey } = useSetSearchParams();

    const [isPublic, setIsPublic] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    async function handleAddRoom(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const imageFile = uploadedImage

        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            image: imageFile,
            isPublic,
        };

        const res = await createRoom(data);
        const { result, response } = res;

        if (response.ok) {
            addToast({
                title: `Room created successfully!`,
                color: 'success'
            });
        } else {
            addToast({
                title: `Failed to create room.`,
                color: 'danger',
                description: response.message
            });
        }
    }

    async function handleUploadImage(file: File, folder: string) {
        setIsUploading(true)

        const res = await uploadImage(file, folder);
        const { result, response } = res;

        if (response.ok) {


            setUploadedImage(result?.name || '')

            addToast({
                title: `Image uploaded successfully!`,
                color: 'success'
            });
        } else {
            addToast({
                title: `Failed to upload image.`,
                color: 'danger',
                description: response.message
            });
        }
        setIsUploading(false)
    }


    return (
        <>
            <Button onClick={() => setSearchParam([{ addRoomModal: 'true' }])}>
                Create Room
            </Button>

            <Modal
                placement="bottom-center"
                size="xl"
                className="!p-0"
                isOpen={addRoomModal === 'true'}
            >
                <ModalContent className="!p-0 overflow-hidden rounded-large">
                    {(onClose) => (
                        <>
                            <div className="relative">
                                <Image
                                    width={400}
                                    height={200}
                                    alt=""
                                    className="w-full aspect-[2.5/1] object-cover"
                                    src="/12-angry.jpg"
                                />
                                <p className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-black/0 px-6 py-4">
                                    Create new Room
                                </p>
                            </div>

                            <form onSubmit={handleAddRoom} className="flex flex-col gap-3">
                                <ModalBody className="px-6">
                                    <Input variant="underlined" type="text" name="name" placeholder="Room Name" required />
                                    <Textarea variant="underlined" name="description" placeholder="Room Description (optional)" />
                                    <Input onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleUploadImage(file, "rooms");
                                        }
                                    }}
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                    />

                                    <Switch
                                        isSelected={isPublic}
                                        onValueChange={setIsPublic}
                                        color="secondary"
                                        size="sm"
                                    >
                                        Public Room
                                    </Switch>
                                </ModalBody>

                                <ModalFooter className="px-6 pb-4">
                                    <Button
                                        type="button"
                                        color="danger"
                                        variant="light"
                                        onPress={() => removeQuey('addRoomModal')}
                                    >
                                        Close
                                    </Button>
                                    <Button type="submit" color="secondary">
                                        Add Room
                                    </Button>
                                </ModalFooter>
                            </form>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
