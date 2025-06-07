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

export default function AddRoomModal() {
    const { setSearchParam, params: { addRoomModal }, getSearchParamsString, removeQuey } = useSetSearchParams()
    const pathname = usePathname()
    const { push } = useRouter()
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
                            <div className='relative'>

                                <Image
                                    width={400}
                                    height={200}
                                    alt=""
                                    className="w-full aspect-[2.5/1] object-cover"
                                    src="/12-angry.jpg"
                                />
                                <p className="flex absolute bottom-0 left-0 w-full
                                                        bg-gradient-to-t from-black/60 to-black/0 flex-col gap-1  px-6 py-4"
                                >
                                    Create new Room
                                </p>
                            </div>

                            {/* Rest of the modal content */}

                            <ModalBody className="px-6">
                                {/* Your form or body content */}
                            </ModalBody>
                            <ModalFooter className="px-6 pb-4">
                                <Button color="danger" variant="light" onPress={() => removeQuey('addRoomModal')}>
                                    Close
                                </Button>
                                <Button color="secondary" onPress={() => removeQuey('addRoomModal')}>
                                    Add Room
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

        </>
    );
}