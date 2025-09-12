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
import { Tabs, Tab } from "@heroui/tabs";
import { Link, Mailbox, MailsIcon } from 'lucide-react';
import InviteByEmail from './components/InviteByEmail';
import InviteByLink from './components/InviteByLink';

export default function InvitationsModal({ roomId, invitationsPromise }: { roomId: string, invitationsPromise: ReturnType<typeof roomsServices.invitations>; }) {

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

    const [selected, setSelected] = useState("link");

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
                        <ModalHeader className="flex flex-col gap-1 mb-0">
                            Invite Roommate
                        </ModalHeader>
                        <ModalBody>

                            <Tabs className={'mx-auto mb-4'} selectedKey={selected} onSelectionChange={(e) => setSelected(e as string)}
                                aria-label="Options" color="primary" variant="bordered">
                                <Tab
                                    key="link"
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <Link className='w-5' />
                                            <span>Invite Link</span>
                                        </div>
                                    }
                                />
                                <Tab
                                    key="email"
                                    title={
                                        <div className="flex items-center space-x-2">
                                            <MailsIcon className='w-5' />
                                            <span>Email</span>
                                        </div>
                                    }
                                />


                            </Tabs>
                            {selected === 'email' && <InviteByEmail data={result?.data || []} roomId={roomId} />}

                            {selected === 'link' && <InviteByLink roomId={roomId} />}

                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={() => onCloseModal()}>
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal >
    );
}