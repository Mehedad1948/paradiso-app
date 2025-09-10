import { Avatar, AvatarGroup, AvatarIcon } from "@heroui/avatar";
import ClientDataSetter from '../utils/ClientDataSetter';
import usersServices from '@/services/user';

export default async function Header() {
    const { result: user } = await usersServices.getMe();

    return (
        <div className='w-full py-4  flex justify-between mx-auto  max-w-7xl items-center'>
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
    );
}