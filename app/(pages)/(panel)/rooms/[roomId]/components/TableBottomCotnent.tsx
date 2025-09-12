'use client'

import useSetSearchParams from '@/hooks/useSetSearchParams';
import ratingServices from '@/services/ratings';
import { PaginatedResponse, RequestResult } from '@/types/request';
import { Pagination } from '@heroui/pagination';
import { use, useState } from 'react';

interface Props {
    dataPromise: Promise<RequestResult<PaginatedResponse<{}>>>,
    className?: string
}

export default function TableBottomContent({ dataPromise, className }: Props) {
    const { result } = use(dataPromise)
    const { params, setSearchParam } = useSetSearchParams()
    const [page, setPage] = useState(Number(params.page) || 1)

    function onChangePage(page: number) {
        setSearchParam([{ page: page }])
        setPage(page)
    }

    return (
        <div className={`
        ${className}
        flex items-center gap-4 justify-end`}>
            <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={result?.meta.totalPages || 1}
                onChange={onChangePage}
            />
        </div>
    );
}