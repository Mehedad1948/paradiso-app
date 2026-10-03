"use client";
import { Avatar } from "@heroui/avatar";
import { useMe } from "@/hooks/queries/useMe";
import { Button } from "@heroui/button";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const { data: user, isPending } = useMe();
  const signOut = useAuthForm(authApi.signOut, true);
  const router = useRouter();

  return (
    <div className="w-full fixed left-0 right-0 top-0 backdrop-blur-sm  z-10 bg-foreground-200/50 py-4  ">
      <div className="flex justify-between lg:px-8 container mx-auto  items-center">
        <div></div>

        <div className="flex relative items-center gap-2">
          {user ? (
            <>
              <Avatar
                name={user.username}
                src={user.avatar}
                alt={user.username}
              />
              <p className="">{user.username}</p>
              <Button
                size="sm"
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
                <p role="alert" className="text-sm text-danger-500">
                  {signOut.error}
                </p>
              )}
            </>
          ) : isPending ? (
            <p>Loading…</p>
          ) : (
            <Link href="/auth/sign-in">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}
