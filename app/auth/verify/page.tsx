'use client'

import { verifyEmail } from '@/app/actions/auth/verify';
import useSetSearchParams from '@/hooks/useSetSearchParams';
import { Button } from '@heroui/button';
import { Input } from "@heroui/input";
import { InputOtp } from '@heroui/input-otp';
import { addToast } from '@heroui/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const { setSearchParam, params: { code, email } } = useSetSearchParams();
  const { push } = useRouter();

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true)
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const code = formData.get("code") as string;

    const res = await verifyEmail({ email, code });
    const { result, response } = JSON.parse(res);

    if (response?.ok) {
      addToast({
        title: "Welcome",
        description: `Your email is successfully verified! `,
        color: 'success',
      });
      push(`/room`);
    } else {
      setError(result?.message || "Unknown error");
    }
    setIsLoading(false)
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-semibold text-white">
        Verify
      </div>
      <form
        ref={formRef}
        onSubmit={handleRegister}
        className="flex mt-8 flex-col items-stretch gap-4"
      >
        <Input defaultValue={email} name="email" label="Email" type="email" />
        <InputOtp
          name="code"

          onComplete={() => {
            formRef.current?.requestSubmit(); // 🧠 Native submit
          }}
          className="mx-auto"
          size="lg"
          defaultValue={code}
          length={4}
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button isLoading={isLoading} isDisabled={isLoading} type="submit" color="secondary">
          Verify
        </Button>
        <Link href={'/auth/sign-in'} className="w-full">
          <Button type="button" color="default" className="w-full">
            Back to log in page
          </Button>
        </Link>
      </form>
    </div>
  );
}
