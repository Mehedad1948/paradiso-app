import { generateInviteLink } from '@/app/actions/rooms/invitations/generateInviteLink';
import { getInviteLinks } from '@/app/actions/rooms/invitations/getInviteLinks';
import { useAction } from '@/hooks/core/useAction';
import { useServerQuery } from '@/hooks/core/useServerQuery';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Button } from '@heroui/button';
import { Spinner } from "@heroui/spinner";
import { addToast } from '@heroui/toast';
import { Copy, Link } from 'lucide-react';
import InviteLinkItem from './InviteLinkItem';
import CopierButton from '@/components/utils/CopierButton';
import { Key, useState } from 'react';

export default function InviteByLink({ roomId }: { roomId: string }) {
    const { data, isLoading, refetch } = useServerQuery(() => getInviteLinks(roomId));

    const { execute, isLoading: isGenerating } = useAction(generateInviteLink, {
        onSuccess: () => {
            refetch();
            addToast({
                title: 'Your link is ready to share!',
                color: 'success',
            });
        },
    });

    // state to persist which accordion item(s) are open
    const [openKeys, setOpenKeys] = useState<Set<React.Key>>(new Set());

    return (
        <div>
            {data?.data && data?.data?.length > 0 && <div className='mb-2'>
                <Button onPress={() => !isGenerating && execute(roomId)}
                    isLoading={isGenerating} size="sm" color="primary">
                    Create New Invite Link <Link className="w-4" />
                </Button>
            </div>}
            <div className="flex flex-col gap-2">
                {isLoading ? (
                    <Spinner />
                ) : data?.data && data?.data.length > 0 ? (
                    <Accordion
                        selectedKeys={openKeys as unknown as Iterable<string>}
                        onSelectionChange={(keys) => setOpenKeys(keys as Set<React.Key>)}
                    >
                        {data.data.map((item, index) => (
                            <AccordionItem
                                key={item.id}
                                aria-label={item.inviteUrl}
                                title={
                                    <div className="line-clamp-1 flex items-center gap-2">
                                        {index + 1}.
                                        <CopierButton content={item.inviteUrl}>
                                            <Copy className="hover:text-primary-500 w-5 transition-colors duration-300" />
                                        </CopierButton>
                                        <p className="line-clamp-1">{item.inviteUrl}</p>
                                    </div>
                                }
                            >
                                <InviteLinkItem
                                    link={item}
                                    onUpdate={() => {
                                        refetch();
                                    }}
                                />
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div
                        onClick={() => !isGenerating && execute(roomId)}
                        className="border cursor-pointer hover:bg-primary-50 border-dashed bg-primary-50/50 border-primary-200 rounded-xl p-6 flex items-center justify-center"
                    >
                        <Button className='pointer-events-none' isLoading={isGenerating} size="sm" color="primary">
                            Create Invite Link <Link className="w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div >
    );
}
