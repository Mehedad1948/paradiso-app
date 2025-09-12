
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
import { Link, Mailbox } from 'lucide-react';
import { Invitation } from '@/types/invitations';


export default function InviteByEmail({ data, roomId }: { data: Invitation[], roomId: string }) {


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

    }

    return (
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
                {data?.map(item =>
                    <Fragment key={item.id}>
                        <span className='text-sm'>{item.email}</span>
                        <Chip className='capitalize' size='sm' color={statusColorPicker(item.status)} >
                            {item.status}
                        </Chip>
                    </Fragment>)}
            </div>
        </div>
    );
}