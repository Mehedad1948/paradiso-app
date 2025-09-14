import { updateInviteLink } from '@/app/actions/rooms/invitations/updateInviteLink';
import { useAction } from '@/hooks/core/useAction';
import { RoomInviteLink } from '@/types/roomInviteLinks';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger
} from "@heroui/dropdown";
import { Input } from '@heroui/input';
import { addToast } from '@heroui/toast';
import { format } from 'date-fns';
import { Edit } from 'lucide-react';
import { Key, useState } from 'react';


export default function InviteLinkItem({ link, onUpdate }: { link: RoomInviteLink, onUpdate: () => void }) {

    const { execute: updateExecute, isLoading: isUpdating } = useAction(updateInviteLink, {
        onSuccess: () => {
            onUpdate()
            addToast({
                title: 'Your link has been updated!',
                color: 'success'
            })
        }
    })

    function handleChangeExpire(key: Key) {
        const stringKey = String(key);
        if (stringKey === "undefined") {
            updateExecute({ expiresAt: undefined, id: link.id, roomId: link.roomId });
            return;
        }

        const days = parseInt(stringKey, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        updateExecute({ expiresAt, id: link.id, roomId: link.roomId });
    }

    const [showUsageEditor, setShowUsageEditor] = useState(false)

    function handleChangeMaxUsage(usage: string | undefined) {
        updateExecute({ maxUsage: Number(usage), id: link.id, roomId: link.roomId });
    }

    function handelChangeStatus() {
        updateExecute({ isActive: !link.isActive, id: link.id, roomId: link.roomId });
    }

    return (
        <div className={` 
            ${isUpdating ? 'blur-sm' : ''}
        grid text-primary-600 grid-cols-[1fr,136px] gap-4
        `}>
            <span>Status</span>
            {<Chip className='cursor-pointer w-full mx-auto mr-0' onClick={handelChangeStatus} variant='bordered' color={link.isActive ? 'success' : 'danger'} >
                {link.isActive ? 'Active' : 'Not Active'}
            </Chip>
            }
            <span>Expires at</span>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant='flat' color='primary'
                        className='flex gap-2 w-full items-center justify-between'>

                        {link.expiresAt ? format(link.expiresAt, 'yyyy MMM dd') : <span className='text-muted-foreground'>Never</span>}
                        <span><Edit className='w-4' /></span>
                    </Button>
                </DropdownTrigger >
                <DropdownMenu aria-label="Dynamic Actions" onAction={handleChangeExpire}>
                    <DropdownItem key="undefined">Never</DropdownItem>
                    <DropdownItem key="365">1 Year</DropdownItem>
                    <DropdownItem key="180">6 Month</DropdownItem>
                    <DropdownItem key="30">1 Month</DropdownItem>
                    <DropdownItem key="7">1 Week</DropdownItem>
                    <DropdownItem key="1">1 Day</DropdownItem>
                </DropdownMenu>
            </Dropdown>
            <span>Max Usage Limit</span>
            <span>
                {showUsageEditor ?
                    <Input onBlur={(e) => handleChangeMaxUsage(e.target.value)}
                        defaultValue={String(link.maxUsage)}
                        type='number'
                        variant='underlined'
                        className='text-muted-foreground' placeholder='Unlimited' />
                    :
                    link.maxUsage ?
                        <Button onPress={() => setShowUsageEditor(s => !s)}
                            className='flex items-center gap-2 w-full justify-between'
                            variant='flat' color={link.maxUsage === link.uses ? 'danger' :
                                link.maxUsage - link.uses < 10 ? 'warning' :
                                    'primary'}>
                            <span>
                                {link.maxUsage} / <span className=''>{link.uses}</span>
                            </span>
                            <Edit className='w-4' />
                        </Button>
                        :
                        <Button onPress={() => setShowUsageEditor(s => !s)} variant='flat' color='primary'
                            className='text-muted-foreground flex items-center gap-2 w-full justify-between' >
                            <span> Unlimited</span>
                            <Edit className='w-4' />
                        </Button>
                }
            </span>
        </div>

    );
}
