'use client'

import { searchDbMovies } from '@/app/actions/movies/searchDbMovies';
import { addMovieToRoom } from '@/app/actions/rooms/addMovieToRoom';
import { useModalController } from '@/hooks/useModalController';
import { DbMovie } from '@/types/movies';
import {
    Autocomplete,
    AutocompleteItem,
} from '@heroui/autocomplete';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from '@heroui/modal';
import { Switch } from "@heroui/switch";
import { addToast } from '@heroui/toast';
import { Popcorn, SearchIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export default function AddMovieModal({ roomId }: { roomId: string }) {
    const pathname = usePathname();
    const [query, setQuery] = useState('');
    const [selectedMovie, setSelectedMovie] = useState<DbMovie | null>(null);
    const [debouncedQuery] = useDebounce(query, 500);
    const [results, setResults] = useState<any[]>([]);

    const [isAdding, setIsAdding] = useState(false);


    const { isOpen, onCloseModal } = useModalController('add-movie-modal')

    useEffect(() => {
        async function handleSearch() {
            if (!debouncedQuery) {
                setResults([]);
                return;
            }

            try {
                const res = await searchDbMovies(debouncedQuery);

                const { result, response } = res;

                setResults(result?.results || []);
            } catch (err) {
                console.error('Search error:', err);
                setResults([]);
            }
        }

        handleSearch();
    }, [debouncedQuery]);

    async function handleAddMovieToRoom() {
        if (!selectedMovie) {
            return
        }
        setIsAdding(true)

        const res = await addMovieToRoom({ dbId: selectedMovie.id, roomId });
        const { result, response } = res
        if (response.ok) {
            addToast({
                title: 'Movie added to room successfully',
                description: 'You can now cast your vote!',
                color: 'success',
            })
            onCloseModal()
        } else {
            addToast({
                title: 'Error adding movie to room',
                description: response.message,
                color: 'danger',
            })
        }
        setIsAdding(false)
    }

    if (!isOpen) return null;

    return (
        <Modal
            placement="bottom-center"
            size="xl"
            isOpen={true}
        // onOpenChange={(e) => {
        //     if (!e) push('/room');
        // }}
        // onClose={() => push('/room')}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 mb-4">
                            Add Movie
                        </ModalHeader>
                        <ModalBody>
                            <Autocomplete
                                startContent={<SearchIcon className="text-default-400" size={20} strokeWidth={2.5} />}
                                variant='underlined'
                                label="Search movies"
                                inputValue={query}
                                onInputChange={setQuery}
                                onSelectionChange={(key) => {
                                    const selected = results.find((r) => r.id.toString() === key);
                                    setSelectedMovie(selected)
                                }}
                            >
                                {results.map((movie) => {

                                    return <AutocompleteItem key={movie.id} textValue={movie.title}>
                                        <div
                                            className='!grid !grid-cols-[40px,_1fr] gap-2 '>
                                            {movie.poster_path ? (
                                                <img
                                                    width={50}
                                                    height={75}
                                                    src={`${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL}w500${movie.poster_path}`}
                                                    alt={movie.title}
                                                    className='w-10 rounded-md h-14 object-cover'
                                                />
                                            ) : (
                                                <div className='w-10 h-14 rounded-md text-blue-400 
                                                flex items-center justify-center bg-blue-900 ' >
                                                    <Popcorn />
                                                </div>
                                            )}
                                            <p className='w-full  line-clamp-1'>
                                                {movie.title}
                                            </p>
                                        </div>
                                    </AutocompleteItem>
                                })}
                            </Autocomplete>
                            {selectedMovie && <div className='w-full'>
                                <div>
                                    <div className='grid grid-cols-[40px,_1fr,_auto] gap-2 p-2
                                                     rounded-lg text-left border items-center border-secondary-500 text-secondary-500'
                                    >
                                        <img
                                            width={50}
                                            height={75}
                                            src={`${process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL}w500${selectedMovie.poster_path}`}
                                            alt={''}
                                            className='w-10 rounded-md h-14 object-cover'
                                        />
                                        <p className='font-semibold'>

                                            {selectedMovie.title}
                                        </p>
                                        <Button size='sm' onPress={() => setSelectedMovie(null)} color='danger'
                                            variant="light" className='font-semibold' >
                                            Remove

                                        </Button>
                                    </div>
                                </div>

                                <div className='grid grid-cols-2 mt-4 gap-4'>
                                    <Input type='number' placeholder='IMDB Rating (optional)' />
                                    <Switch color='secondary' size='sm' >Watched Together</Switch>
                                </div>
                            </div>}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onCloseModal}>
                                Close
                            </Button>
                            <Button isLoading={isAdding} isDisabled={isAdding} color="secondary" onPress={() => handleAddMovieToRoom()}>
                                Add Movie
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
