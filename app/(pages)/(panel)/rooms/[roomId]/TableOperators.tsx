'use client'

import SearchParamsSetterWrapper from '@/components/utils/SearchParamsSetterWrapper';
import useSetSearchParams from '@/hooks/useSetSearchParams';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { SearchIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TableOperators() {
    const { params, setSearchParam } = useSetSearchParams();
    const [search, setSearch] = useState(params.search || '');


useEffect(() => {
  const timeout = setTimeout(() => {
    // only update if it's really different
    if (search !== (params.search ?? '')) {
      setSearchParam([{ search }]);
    }
  }, 400);

  return () => clearTimeout(timeout);
}, [search, params.search, setSearchParam]);

    return (
        <div className='flex items-center gap-2 mb-4 justify-between'>
            <div className='flex items-center w-fit'>
                <Input
                    className='w-72'
                    startContent={<SearchIcon className="text-default-400" size={20} strokeWidth={2.5} />}
                    endContent={search && (
                        <X
                            onClick={() => setSearch('')}
                            className="text-default-400 cursor-pointer"
                            size={20}
                            strokeWidth={2.5}
                        />
                    )}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search movies..."
                />
            </div>

            <div className='flex items-center gap-4'>
                <SearchParamsSetterWrapper
                    className='block'
                    keyValue={{ 'invite-modal': 'true' }}
                >
                    <Button color='primary'>Invite </Button>
                </SearchParamsSetterWrapper>

                <SearchParamsSetterWrapper
                    className='block'
                    keyValue={{ 'add-movie-modal': 'true' }}
                >
                    <Button color='secondary'>Add Movie</Button>
                </SearchParamsSetterWrapper>
            </div>
        </div>
    );
}
