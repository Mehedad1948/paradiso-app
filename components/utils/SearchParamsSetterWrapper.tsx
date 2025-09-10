'use client'

import React, { ReactElement, MouseEvent } from 'react';
import useSetSearchParams from '@/hooks/useSetSearchParams';

type SearchParamsSetterWrapperProps = {
    keyValue: { [key: string]: string };
    children: ReactElement;
} & React.HTMLAttributes<HTMLElement>;

export default function SearchParamsSetterWrapper({
    keyValue,
    children,
    ...props
}: SearchParamsSetterWrapperProps) {
    const { setHashParams } = useSetSearchParams();

    const handleClick = () => {
        setHashParams([keyValue]);
    };

    return React.cloneElement(children, {
        ...props,
        onClick: (e: MouseEvent) => {
            if (children.props.onClick) {
                children.props.onClick(e);
            }
            if (!e.defaultPrevented) {
                handleClick();
            }
        },
    });
}
