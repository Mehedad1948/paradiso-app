'use client'

import { resetPassword } from '@/app/actions/auth/reset-password';
import { verifyEmail } from '@/app/actions/auth/verify';
import { Button } from '@heroui/button';
import { Input } from "@heroui/input";
import { InputOtp } from '@heroui/input-otp';
import { addToast } from '@heroui/toast';
import { useRef, useState } from 'react';

export default function ResetPasswordPage({ }) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const email = 'aweewasdasd@gmail.com';
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    setError('')
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;
    const password = formData.get("password") as string;

    const res = await resetPassword({ email, code, password });
    const { result, response } = JSON.parse(res);

    if (response?.ok) {
      addToast({
        title: "Your password has been reset",
        color: 'success',
      });
    } else {
      setError(result?.message || "Unknown error");
    }
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-semibold text-white">
        Reset Password
      </div>
      <form
        ref={formRef}
        onSubmit={handleRegister}
        className="flex mt-8 flex-col items-stretch gap-4"
      >
        <div className='w-full'>
          We have sent a verification code to your email:

        </div>
        <div className='text-secondary-500 w-full text-center'>{email}</div>
        <InputOtp
          name="code"
          // onComplete={() => {
          //   formRef.current?.requestSubmit();
          // }}
          className="mx-auto"
          size="lg"
          length={4}
        />
        <Input name='password' label="Password" type="password" />

        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" color="secondary">
          Reset Password
        </Button>
      </form>
    </div>
  );
}
