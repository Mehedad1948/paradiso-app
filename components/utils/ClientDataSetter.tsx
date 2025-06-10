'use client'

import { useUserStore } from '@/store/user';
import { User } from '@/types/user';
import { useEffect } from 'react';

export default function ClientDataSetter({ user }: { user: User | null }) {
    const { setUser } = useUserStore();
    useEffect(() => {
        setUser(user);
    }, [user]);
    return null
}