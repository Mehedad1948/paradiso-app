'use client'

import { ReactNode, useState } from 'react';
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { signIn } from '@/app/actions/auth/sing-in';
import { addToast } from '@heroui/toast';
import { register } from '@/app/actions/auth/register';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    const res = await register({ email, password, username });
    const { result, response } = JSON.parse(res);

    if (response?.ok) {
      addToast({
        title: "Welcome",
        description: `Hi ${result?.user?.name || "there"}👋`,
        color: 'success',
      })
    } else {
      setError(result?.message || "Unknown error");
    }
  }
  return (
    <div className=" h-full flex flex-col justify-center">

      <div className='text-3xl font-semibold text-white'>
        Register
      </div>
      <form onSubmit={handleRegister} className='flex mt-8 flex-col items-stretch  gap-4'>
        <Input name='username' label="Username" type="text" />
        <Input name='email' label="Email" type="email" />
        <Input name='password' label="Password" type="password" />
        {/* <Input label="Username" type="text" /> */}
        <p>{error && <span className="text-sm text-rose-500">{error}</span>}</p>
        <Button type='submit' color='secondary'>
          Register
        </Button>
      </form>

    </div>
  );
}
