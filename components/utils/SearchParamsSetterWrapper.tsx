'use client'

import { useHashParams } from '@/hooks/useHashParams';
import React, { MouseEvent, ReactElement } from 'react';

type SearchParamsSetterWrapperProps = {
    keyValue: { [key: string]: string };
    children: ReactElement;
} & React.HTMLAttributes<HTMLElement>;

export default function SearchParamsSetterWrapper({
    keyValue,
    children,
    ...props
}: SearchParamsSetterWrapperProps) {
    const { setHashParams } = useHashParams();

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
