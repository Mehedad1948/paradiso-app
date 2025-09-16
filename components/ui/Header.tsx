import { Avatar, AvatarGroup, AvatarIcon } from "@heroui/avatar";
import ClientDataSetter from '../utils/ClientDataSetter';
import usersServices from '@/services/user';

export default async function Header() {
    const { result: user } = await usersServices.getMe();

    return (
        <div className='w-full fixed left-0 right-0 top-0   z-10 bg-foreground-200/50 py-4  '>
            <div className='flex justify-between lg:px-8 container mx-auto  items-center'>

                <ClientDataSetter user={user} />
                <div></div>

                <div className='flex relative items-center gap-2'>
                    {user ? (
                        <>
                            <Avatar name={user.username} src={user.avatar} alt={user.username} />
                            <p className=''>{user.username}</p>
                        </>
                    ) : (
                        <p>Guest</p>
                    )}
                </div>
            </div>
        </div>
    );
}