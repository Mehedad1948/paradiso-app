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
    ModalFooter
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
    const [rate, setRate] = useState(7)

    const [isAdding, setIsAdding] = useState(false);

    const { push } = useRouter();


    async function handleVote() {


        const res = await castVote(roomId, { movieId: movie.id, rate });
        console.log({ roomId, movie });

        const { result, response } = JSON.parse(res)
        if (response.ok) {
            addToast({
                title: 'Rated!',
                color: 'success',
            })
            onClose()
        } else {
            addToast({
                title: "Couldn't casting your vote!",
                description: result.message,
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
                        <div className="relative">
                            <img className="w-full aspect-[2.5/1] object-cover"
                                src={process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL + movie.poster_path}
                                alt={movie.title}
                            />
                            <p className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-black/0 px-6 py-4">
                                Rate {movie.title}
                            </p>
                        </div>

                        <form className="flex flex-col gap-3">
                            <ModalBody className="px-6">
                                <div className='flex items-center gap-2'>
                                    <Input value={rate.toString()} onChange={(e) => setRate(Number(e.target.value))} type='number'
                                        className='w-fit text-center' />
                                    <Button
                                        type="button"
                                        color="secondary"
                                        onPress={handleVote}
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </ModalBody>

                            <ModalFooter className="px-6 pb-4">
                                <Button
                                    type="button"
                                    color="primary"
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
