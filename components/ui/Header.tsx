"use client";
import { Avatar } from "@heroui/avatar";
import { useMe } from "@/hooks/queries/useMe";
import { Button } from "@heroui/button";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";

export default function Header() {
  const { data: user, isPending } = useMe();
  const signOut = useAuthForm(authApi.signOut, true);
  const router = useRouter();

  return (
    <div className="fixed inset-x-0 top-0 z-40 bg-canvas/95 px-[4.5vw] text-ink backdrop-blur-md max-md:px-[5vw]">
      <nav aria-label="Main navigation" className="mx-auto flex min-h-[88px] max-w-[1600px] items-center justify-between gap-6 border-b border-line max-md:min-h-20 max-md:gap-3 max-[480px]:flex-wrap max-[480px]:gap-y-3 max-[480px]:py-3.5">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-semibold tracking-[-0.075em] [&>svg]:text-accent max-[480px]:text-[23px]" aria-label="Paradiso home">
          <Asterisk size={23} strokeWidth={1.6} aria-hidden="true" /> paradiso
        </Link>

        <div className="flex items-center gap-5 text-[15px] font-semibold max-md:gap-3 max-md:text-sm max-[480px]:basis-full max-[480px]:justify-between">
          <Link href="/rooms" className="inline-flex items-center gap-2 border-b border-ink py-1.5">
            Dashboard <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <ThemeSwitch />
          {user ? (
            <div className="flex items-center gap-2.5 max-md:gap-2 max-[480px]:ml-auto">
              <Avatar
                name={user.username}
                src={user.avatar ?? undefined}
                alt={user.username}
              />
              <p className="max-w-[130px] truncate max-md:hidden">{user.username}</p>
              <Button
                size="sm"
                className="text-sm font-semibold text-ink max-[480px]:min-w-0 max-[480px]:px-2"
                variant="light"
                isLoading={signOut.isPending}
                isDisabled={signOut.isPending}
                onPress={() => {
                  void signOut.submit(undefined, () =>
                    router.replace("/auth/sign-in?reason=signed-out"),
                  );
                }}
              >
                Sign out
              </Button>
              {signOut.error && (
                <p role="alert" className="absolute right-0 top-full w-[min(360px,90vw)] rounded-md border border-line bg-elevated p-4 text-danger-500">
                  {signOut.error}
                </p>
              )}
            </div>
          ) : isPending ? (
            <p>Loading…</p>
          ) : (
            <Link href="/auth/sign-in" className="text-muted">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
