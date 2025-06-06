'use client'

import { ReactNode, useEffect, useState } from 'react';
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { signIn } from '@/app/actions/auth/sing-in';
import { addToast } from '@heroui/toast';
import { Link } from '@heroui/link';
import useSetSearchParams from '@/hooks/useSetSearchParams';
import { useRouter } from 'next/navigation';

export default function SignInPage({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setSearchParam, params: { origin, refresh, email } } = useSetSearchParams();
  const { push } = useRouter();

  useEffect(() => {
    if (refresh) {
      setLoading(true);
      push(`/api/auth/refresh-token?redirect=${origin}`);
    }
  }, [refresh]);

  async function handleLogIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true)
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn({ email, password });
    const { result, response } = JSON.parse(res);

    if (response?.ok) {
      addToast({
        title: "Welcome",
        description: `Hi ${result?.user?.name || "there"} 👋`,
        color: 'success',
      });
    } else {
      setError(result?.message || "Unknown error");
    }
    setIsLoading(false);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-white text-xl">
        Refreshing session...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-semibold text-white">
        Log in
      </div>
      <form onSubmit={handleLogIn} className="flex mt-8 flex-col items-stretch gap-4">
        <Input defaultValue={email} name="email" label="Email" type="email" />
        <Input name="password" label="Password" type="password" />
        <p>{error && <span className="text-sm text-rose-500">{error}</span>}</p>
        <p className="text-sm">
          Forgot your password?
          <Link href="/auth/forgot-password" size="sm" className="ml-2" color="secondary">
            Reset here
          </Link>
        </p>
        <Button isLoading={isLoading || loading} type="submit" color="secondary">
          {loading ? "Refreshing session..." : "Log in"}
        </Button>
        <Button type="button" variant='shadow' color="primary" onClick={() => push('/auth/register')}>
          Create Account
        </Button>
      </form>
    </div>
  );
}
