"use client";
import SlideCommit, { type SlideCommitProps } from "./SlideCommit";

/** SlideCommit with the app's compact pill styling; any prop can still be overridden. */
export default function SlideToConfirm(props: SlideCommitProps) {
  return (
    <SlideCommit
      width={220}
      height={44}
      radius={22}
      trackColor="#18181b"
      handleColor="#f5f5f5"
      {...props}
    />
  );
}
