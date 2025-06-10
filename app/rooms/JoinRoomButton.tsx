'use client'

import { RoomsServices } from '@/services/rooms';
import { useUserStore } from '@/store/user';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';
import { joinRoom } from '../actions/rooms/joinRoom';
import { useState } from 'react';

export default function JoinRoomButton({ roomId }: { roomId: number }) {
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async () => {
        if (!user) return;
        setIsLoading(true)

        const res = await joinRoom({ userId: user.id, roomId });

        const { result, response } = JSON.parse(res);

        if (response.ok) {
            addToast({
                title: "You are now a member of room",
                color: 'success'
            });
        } else {
            addToast({
                title: "Failed to join the room",
                description: result.message,
                color: 'danger'
            });
        }
        setIsLoading(false)
    };

    return (
        <Button
            isLoading={isLoading}
            isDisabled={isLoading}
            onPress={handleJoin}
            className=" text-foreground-800 bg-black/20"
            color="secondary"
            radius="lg"
            size="sm"
            variant="flat"
        >
            Join
        </Button>
    );
}