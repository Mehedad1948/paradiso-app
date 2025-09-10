'use client'

import { useModalController } from '@/hooks/useModalController'
import roomsServices from '@/services/rooms';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from '@heroui/modal';
import { Fragment, use, useState } from 'react';
import { useAction } from '@/hooks/core/useAction';
import { inviteUser } from '@/app/actions/rooms/invitations';
import { addToast } from '@heroui/toast';
import { Chip } from '@heroui/chip';
import { statusColorPicker } from '@/utils/statusColorPicker';
import { MovieWithRatings } from '@/types/ratings';
import { Alert } from '@heroui/alert';
import { removeMovieFromRoom } from '@/app/actions/rooms/removeMovieFromRoom';
import useSetSearchParams from '@/hooks/useSetSearchParams';

export default function DeleteMovieFromRoomModal({ movie, onClose, }: { movie: MovieWithRatings, onClose: () => void }) {

    const { isOpen, onCloseModal } = useModalController('delete-movie-modal')

    const { mainParams: { roomId } } = useSetSearchParams()



    const { execute, isLoading, isError } = useAction(removeMovieFromRoom, {
        onSuccess: () => {
            addToast({
                title: `Move ${movie.title} was successfully deleted`,
                color: 'success',
            })
            onClose()
        }
    })

    async function handleDelete() {
        const res = await execute({ movieId: movie.id, roomId })

    }

    return (
        <Modal
            placement="bottom-center"
            size="xl"
            isOpen={isOpen}
        // onOpenChange={(e) => {
        //     if (!e) push('/room');
        // }}
        // onClose={() => push('/room')}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 mb-4">
                            Delete move from room
                        </ModalHeader>
                        <ModalBody className="flex flex-col-reverse md:grid
                              md:grid-cols-[1fr,_0.4fr] gap-4">
                            <div className='flex flex-col gap-2 h-full justify-between'>
                                <ModalHeader className='px-0 text-primary-500'>
                                    Delete {movie.title}
                                </ModalHeader>


                                <div className='flex flex-col gap-2'>
                                    <div className='flex items-center gap-2'>
                                    </div>
                                </div>
                            </div>
                            <img className="nd:w-full h-32 md:h-auto rounded-xl md:aspect-[1/1.6] object-contain md:object-cover"
                                src={process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL + 'w500' + movie.poster_path}
                                alt={movie.title}
                            />
                        </ModalBody>

                        <ModalFooter className='flex flex-col'>

                            <Alert color='danger'>
                                All users votes will be removed!
                            </Alert>
                            <div className='flex items-center justify-between'>
                                <Button color="danger" variant="light" onPress={() => onCloseModal(onClose)}>
                                    Close
                                </Button>
                                <Button color="danger" onPress={() => handleDelete()}>
                                    Delete
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}