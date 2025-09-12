import { generateInviteLink } from '@/app/actions/rooms/invitations/generateInviteLink';
import { getInviteLinks } from '@/app/actions/rooms/invitations/getInviteLinks';
import { useAction } from '@/hooks/core/useAction';
import { useServerQuery } from '@/hooks/core/useServerQuery';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';
import { Link, LucideSplinePointer } from 'lucide-react';
import { Spinner } from "@heroui/spinner";
export default function InviteByLink({ roomId }: { roomId: string }) {
    const { data, isLoading, refetch } = useServerQuery(() => getInviteLinks(roomId))
    const { data: generatedLinkData, execute, isLoading: isGenerating } = useAction(generateInviteLink, {
        onSuccess: () => {
            refetch()
            addToast({
                title: 'Your link is ready to share!',
                color: 'success'
            })
        }
    })

    return (
        <div className=''>
            <div className='flex flex-col gap-2'>
                {isLoading ? <Spinner /> : data?.data && data?.data?.length > 0 ?
                    data?.data?.map(item => <div>{item.inviteUrl}</div>) :
                    <div onClick={() => !isGenerating && execute(roomId)}
                        className='border cursor-pointer hover:bg-primary-50 border-dashed bg-primary-50/50 border-primary-200 rounded-xl p-6 flex items-center justify-center'>
                        <Button isLoading={isGenerating} size='sm' color='primary'>
                            Create Invite Link <Link className='w-4' />
                        </Button>
                    </div>
                }
            </div>
        </div>
    );
}