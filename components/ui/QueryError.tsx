"use client";
import { Button } from "@heroui/button";
import { BffError } from "@/lib/api/client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { authHref } from "@/lib/auth/redirect";

export default function QueryError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  return (
    <div role="alert" className="my-4 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-5 text-base">
      <p>{error.message}</p>
      {error instanceof BffError && error.status === 401 ? (
        <Link
          href={authHref("sign-in", {
            origin: `${pathname}${query ? `?${query}` : ""}`,
            refresh: "true",
            reason: "session-expired",
          })}
        >
          Sign in
        </Link>
      ) : (
        <Button size="sm" onPress={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
