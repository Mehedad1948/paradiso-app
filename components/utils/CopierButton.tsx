'use client'

import { addToast } from '@heroui/toast';
import { ButtonHTMLAttributes } from 'react';

interface BackProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    content: string;
    message?: string
}

export default function CopierButton({ content, message, ...props }: BackProps) {
    const handleCopyClick = () => {
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(content)
                .then(() => {
                    addToast({ title: message || `Copied to clipboard`, color: 'primary' })
                })
                .catch((err) => {
                    console.error("Failed to copy text: ", err);
                });
        } else {
            console.error("Clipboard API not supported");
        }
    };

    return (
        <button onClick={(e) => {
            e.stopPropagation();

            props.onClick && props.onClick(e)
            handleCopyClick()
        }}
            {...props}>
            {props.children}
        </button>
    );
}