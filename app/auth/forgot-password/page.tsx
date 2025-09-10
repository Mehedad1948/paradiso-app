'use client'

import { forgotPassword } from '@/app/actions/auth/forgot-password';
import useSetSearchParams from '@/hooks/useSetSearchParams';
import { Button } from '@heroui/button';
import { Input } from "@heroui/input";
import { addToast } from '@heroui/toast';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { params: { email } } = useSetSearchParams();

  const router = useRouter()

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true)
    setError('')
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const res = await forgotPassword({ email });
    const { result, response } = res;

    if (response?.ok) {
      addToast({
        title: "Email Sent",
        description: `Please check your email for the password reset link.`,
        color: 'success',
      });
      router.push(`/auth/reset-password?email=${email}`);
    } else {
      setError(response?.message || "Unknown error");
    }
    setIsLoading(false)
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-semibold text-white">
        Forgot Password
      </div>
      <form
        ref={formRef}
        onSubmit={handleRegister}
        className="flex mt-8 flex-col items-stretch gap-4"
      >
        <Input name="email" defaultValue={email} label="Email" type="email" />

        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button isLoading={isLoading} type="submit" color="secondary">
          Send Reset Link
        </Button>
        <Button type="button" color="default" onClick={() => router.push('/auth/sign-in')}>
          Back to log in page
        </Button>
      </form>
    </div>
  );
}
