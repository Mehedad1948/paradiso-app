'use client'

import useSetSearchParams from '@/hooks/useSetSearchParams';
import { Pagination } from '@heroui/pagination';
import { useState } from 'react';

interface Props { pages: number, }

export default function TableBottomContent({ pages, }: Props) {
    const { params, setSearchParam } = useSetSearchParams()
    const [page, setPage] = useState(Number(params.page) || 1)

    function onChangePage(page: number) {
        setSearchParam([{ page: page }])
        setPage(page)
    }

    return (
        <div className='flex items-center gap-4 justify-end'>
            <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages}
                onChange={onChangePage}
            />
        </div>
    );
}