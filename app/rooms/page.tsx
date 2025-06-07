import { RoomsServices } from '@/services/rooms';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import Image from 'next/image';
import { Suspense } from 'react';
import AddRoomModal from './AddRoomModal';

export default async function page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {

    return (
        <div className='py-8'>
            <div className='py-4'>
                <AddRoomModal />
            </div>
            <Suspense>
                <RenderRooms />
            </Suspense>
        </div>
    );
}

async function RenderRooms() {
    const { result } = await new RoomsServices().getRooms({ page: 1, limit: 10 });
    return <div className='grid grid-cols-4 gap-4'>
        {result && result.data.map((room) => (
            <Card key={room.id} isFooterBlurred className="border-none" radius="lg">
                <Image
                    alt="Woman listing to music"
                    className="object-cover w-full h-full"
                    height={280}
                    src="https://heroui.com/images/hero-card.jpeg"
                    width={280}
                />
                <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                    <p className="text-tiny text-white font-semibold">{room.name}</p>
                    <Button
                        className="text-tiny text-white bg-black/20"
                        color="default"
                        radius="lg"
                        size="sm"
                        variant="flat"
                    >
                        Join
                    </Button>
                </CardFooter>
            </Card>
        ))}
    </div>
}