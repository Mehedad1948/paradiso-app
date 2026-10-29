"use client";
import { Input, type InputProps } from "@heroui/input";
import { EyeClosedIcon, EyeIcon } from "@solar-icons/react/linear";
import { useState } from "react";

export default function PasswordInput(props: Omit<InputProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      endContent={
        <button
          type="button"
          className="focus:outline-none text-default-500"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={props.isDisabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <EyeClosedIcon size={18} aria-hidden="true" />
          ) : (
            <EyeIcon size={18} aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
