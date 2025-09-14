
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
import { Fragment, use, useEffect, useState } from 'react';
import { useAction } from '@/hooks/core/useAction';
import { inviteUser } from '@/app/actions/rooms/invitations';
import { addToast } from '@heroui/toast';
import { Chip } from '@heroui/chip';
import { statusColorPicker } from '@/utils/statusColorPicker';
import { Tabs, Tab } from "@heroui/tabs";
import { ChevronLeft, ChevronRight, Link, Mailbox } from 'lucide-react';
import { Invitation } from '@/types/invitations';
import { useServerQuery } from '@/hooks/core/useServerQuery';
import { getInvitations } from '@/app/actions/rooms/invitations/getInvitations';
import { PaginationItemType, usePagination } from '@heroui/pagination';
import { cn } from '@heroui/theme';
import { Spinner } from '@heroui/spinner';


export default function InviteByEmail({ roomId }: { roomId: string }) {
    const [total, setTotal] = useState(0)

    const {
        activePage,
        range,
        setPage,
        onNext,
        onPrevious,
    } = usePagination({
        total: total,
        showControls: true,
        siblings: 2,
        boundaries: 1,
    });

    const { data, isLoading: isGetting, refetch } = useServerQuery(
        () => getInvitations(roomId, activePage),
        [activePage],
    );

    useEffect(() => {
        if (data?.meta?.totalPages) {
            setTotal(data.meta.totalPages);
        }
    }, [data?.meta?.totalPages, setTotal]);



    const [email, setEmail] = useState('')



    const { execute, isLoading, isError } = useAction(inviteUser, {
        onSuccess: () => {
            addToast({
                title: `An invitation email was sent to ${email}`,
                color: 'success',
            })
            refetch()
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

            {isGetting ?
                <div className='flex items-center justify-center p-4'>
                    <Spinner />
                </div>
                : <div className='grid grid-cols-[1fr,_auto] mt-2 gap-y-3 items-center'>
                    {data?.data.map(item =>
                        <Fragment key={item.id}>
                            <span className='text-sm'>{item.email}</span>
                            <Chip className='capitalize' size='sm' color={statusColorPicker(item.status)} >
                                {item.status}
                            </Chip>
                        </Fragment>)}
                </div>}

            {range.length > 3 && <ul className="flex gap-2 items-center w-fit mx-auto mt-4">
                {range.map((page) => {



                    if (page === PaginationItemType.DOTS) {
                        return (
                            <li key={page} className="w-4 h-4">
                                ...
                            </li>
                        );
                    }

                    return typeof page === 'number' && (
                        <li key={page} aria-label={`page ${page}`} className="w-4 h-4">
                            <button
                                className={cn(
                                    "w-full h-full bg-default-300 rounded-full",
                                    activePage === page && "bg-secondary",
                                )}
                                onClick={() => setPage(page)}
                            />
                        </li>
                    );
                })}
            </ul>}
        </div>
    );
}