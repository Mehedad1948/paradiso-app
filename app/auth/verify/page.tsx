'use client'

import { verifyEmail } from '@/app/actions/auth/verify';
import { Button } from '@heroui/button';
import { Input } from "@heroui/input";
import { InputOtp } from '@heroui/input-otp';
import { addToast } from '@heroui/toast';
import { useRef, useState } from 'react';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const code = formData.get("code") as string;

    const res = await verifyEmail({ email, code });
    const { result, response } = JSON.parse(res);

    if (response?.ok) {
      addToast({
        title: "Welcome",
        description: `Hi ${result?.user?.name || "there"}👋`,
        color: 'success',
      });
    } else {
      setError(result?.message || "Unknown error");
    }
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
        <Input name="email" label="Email" type="email" />
        <InputOtp
          name="code"
          onComplete={() => {
            formRef.current?.requestSubmit(); // 🧠 Native submit
          }}
          className="mx-auto"
          size="lg"
          defaultValue="1234"
          length={4}
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" color="secondary">
          Verify
        </Button>
      </form>
    </div>
  );
}
