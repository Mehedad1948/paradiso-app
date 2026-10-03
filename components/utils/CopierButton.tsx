"use client";

import { addToast } from "@heroui/toast";
import { ButtonHTMLAttributes } from "react";

interface BackProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  message?: string;
}

export default function CopierButton({
  content,
  message,
  onClick,
  ...props
}: BackProps) {
  const handleCopyClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          addToast({
            title: message || `Copied to clipboard`,
            color: "primary",
          });
        })
        .catch(() => {
          addToast({
            title: "Unable to copy. Please copy the text manually.",
            color: "danger",
          });
        });
    } else {
      addToast({
        title: "Clipboard unavailable. Please copy the text manually.",
        color: "danger",
      });
    }
  };

  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        e.stopPropagation();

        onClick?.(e);
        if (!e.defaultPrevented) handleCopyClick();
      }}
    >
      {props.children}
    </button>
  );
}
