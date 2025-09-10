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

export default function InvitationsModal({ roomId, invitationsPromise }: { roomId: string, invitationsPromise: ReturnType<typeof roomsServices.invitations>; }) {
    const [isAdding, setIsAdding] = useState(false);

    const { isOpen, onCloseModal } = useModalController('invite-modal')

    const { result } = use(invitationsPromise)

    const [email, setEmail] = useState('')

    const { execute, isLoading, isError } = useAction(inviteUser, {
        onSuccess: () => {
            addToast({
                title: `An invitation email was sent to ${email}`,
                color: 'success',
            })
            setEmail('')
        }
    })

    async function handleInvite() {
        const res = await execute({ email, roomId })
        console.log(res);

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
                            Invite Roommate
                        </ModalHeader>
                        <ModalBody>

                            <div>
                                <div className='flex items-center gap-2 mb-4'>
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        type='email'
                                    />
                                    <Button color='primary' isLoading={isLoading} onPress={handleInvite}>
                                        Invite
                                    </Button>
                                </div>
                                <p className='font-semibold'>Invitations</p>
                                <div className='grid grid-cols-[1fr,_auto] mt-2 gap-y-3 items-center'>
                                    {result?.invitations.map(item => <Fragment key={item.id}>
                                        <span className='text-sm'>{item.email}</span>
                                        <Chip className='capitalize' size='sm' color={statusColorPicker(item.status)} >
                                            {item.status}
                                        </Chip>
                                    </Fragment>)}
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onCloseModal}>
                                Close
                            </Button>
                            <Button isLoading={isAdding} isDisabled={isAdding} color="secondary" onPress={() => handleAddMovieToRoom()}>
                                Invite
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}