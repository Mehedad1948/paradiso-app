"use client";
import { InputOtp, type InputOtpProps } from "@heroui/input-otp";

const classNames: InputOtpProps["classNames"] = {
  base: "w-full",
  wrapper: "w-full",
  segmentWrapper: "flex w-full gap-3",
  // Slots spring up when a digit lands in them (overshooting easing), like reactbits Code Slots.
  segment: [
    "h-14 w-auto flex-1 text-xl font-semibold",
    "transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.8,0.64,1)]",
    "data-[has-value=true]:-translate-y-1 data-[has-value=true]:scale-105 data-[has-value=true]:border-secondary",
    "data-[active=true]:border-secondary data-[active=true]:shadow-[0_0_0_3px_rgba(168,85,247,0.25)]",
    "motion-reduce:transition-none motion-reduce:transform-none",
  ].join(" "),
};

export default function AuthOtpInput(props: Omit<InputOtpProps, "classNames">) {
  return <InputOtp classNames={classNames} {...props} />;
}
