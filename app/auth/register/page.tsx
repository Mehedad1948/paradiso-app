'use client'

import { ReactNode, useState } from 'react';
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { signIn } from '@/app/actions/auth/sing-in';
import { addToast } from '@heroui/toast';
import { register } from '@/app/actions/auth/register';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { push } = useRouter()

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const username = formData.get("username") as string;

    // Basic validations
    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const res = await register({ email, password, username });
    const { result, response } = JSON.parse(res);

    if (response?.ok) {
      addToast({
        title: "Account successfully created!",
        description: `Please check your inbox to get the verification link`,
        color: 'success',
      });
      push(`/auth/verify?email=${email}`);
    } else {
      setError(result?.message || "Unknown error");
    }
    setIsLoading(false);
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-semibold text-white">
        Register
      </div>
      <form onSubmit={handleRegister} className="flex mt-8 flex-col items-stretch gap-4">
        <Input name="username" label="Username" type="text" />
        <Input name="email" label="Email" type="email" />
        <Input name="password" label="Password" type="password" />
        <Input name="confirmPassword" label="Confirm Password" type="password" />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button isLoading={isLoading} type="submit" color="secondary">
          Register
        </Button>
        <Button type="button" color="default" onClick={() => push('/auth/sign-in')}>
          Go to login page
        </Button>
      </form>
    </div>
  );
}
