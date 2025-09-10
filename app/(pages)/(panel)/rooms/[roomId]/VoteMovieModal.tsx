'use client'

import { castVote } from '@/app/actions/ratings/castVote';
import useSetSearchParams from '@/hooks/useSetSearchParams';
import { DbMovie } from '@/types/movies';
import { MovieWithRatings } from '@/types/ratings';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader
} from '@heroui/modal';
import { addToast } from '@heroui/toast';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

export default function VoteMovieModal({ movie, onClose }: { movie: MovieWithRatings, onClose: () => void }) {
    const pathname = usePathname();
    const [query, setQuery] = useState('');
    const [selectedMovie, setSelectedMovie] = useState<DbMovie | null>(null);
    const [debouncedQuery] = useDebounce(query, 500);
    const [results, setResults] = useState<any[]>([]);
    const { setSearchParam, removeQuey, params, mainParams: { roomId } } = useSetSearchParams();
    const [rate, setRate] = useState(movie.ratings[0].rate || 7)

    const [isAdding, setIsAdding] = useState(false);

    const { push } = useRouter();


    async function handleVote() {


        const res = await castVote(roomId, { movieId: movie.id, rate });

        const { result, response } = res
        if (response.ok) {
            addToast({
                title: 'Rated!',
                color: 'success',
            })
            onClose()
        } else {
            addToast({
                title: "Couldn't casting your vote!",
                description: response.message,
                color: 'danger',
            })
        }
        setIsAdding(false)
    }


    return (
        <Modal
            placement="bottom-center"
            size="xl"
            isOpen={true}
            // onOpenChange={(e) => {
            //     if (!e) push('/room');
            // }}
            onClose={onClose}
        >
            <ModalContent className="!p-0 overflow-hidden rounded-large">
                {(onClose) => (
                    <>

                        <form className="flex flex-col gap-3">
                            <ModalBody className="flex flex-col-reverse md:grid
                              md:grid-cols-[1fr,_0.7fr] gap-4">
                                <div className='flex flex-col gap-2 h-full justify-between'>
                                    <ModalHeader className='px-0'>
                                        Rate {movie.title}
                                    </ModalHeader>

                                    <div className='flex flex-col gap-2'>
                                        <div className='flex items-center gap-2'>
                                            <Input value={rate.toString()} onChange={(e) => setRate(Number(e.target.value))} type='number'
                                                className='w-full text-center' />
                                            <Button
                                                type="button"
                                                color="secondary"
                                                onPress={handleVote}
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                        <Button
                                            type="button"
                                            color="primary"
                                            onPress={onClose}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                                <img className="nd:w-full h-64 md:h-auto rounded-xl md:aspect-[1/1.6] object-contain md:object-cover"
                                    src={process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL + 'w500' + movie.poster_path}
                                    alt={movie.title}
                                />
                            </ModalBody>

                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
