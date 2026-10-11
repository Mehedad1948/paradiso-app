"use client";
import { InputOtp, type InputOtpProps } from "@heroui/input-otp";

const classNames: InputOtpProps["classNames"] = {
  base: "w-full",
  wrapper: "w-full",
  segmentWrapper: "flex w-full gap-3",
  segment: "h-14 w-auto flex-1 text-xl",
};

export default function AuthOtpInput(props: Omit<InputOtpProps, "classNames">) {
  return <InputOtp classNames={classNames} {...props} />;
}
