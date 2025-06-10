import { RoomsServices } from '@/services/rooms';

export default async function page({ params }: { params: Promise<{ roomId: string }> }) {
    console.log(await params);

    const roomId = (await params).roomId;
    const { result } = await new RoomsServices().getRoomById(Number(roomId));
    
    console.log(result);

    return (
        <div>

        </div>
    );
}