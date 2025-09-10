'use client'

import { forgotPassword } from '@/app/actions/auth/forgot-password'
import { resetPassword } from '@/app/actions/auth/reset-password'
import { verifyEmail } from '@/app/actions/auth/verify'
import useSetSearchParams from '@/hooks/useSetSearchParams'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { InputOtp } from '@heroui/input-otp'
import { addToast } from '@heroui/toast'
import { SquarePen } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(120)
  const [canResend, setCanResend] = useState(false)

  const formRef = useRef<HTMLFormElement | null>(null)
  const {
    params: { email, code }
  } = useSetSearchParams()
  const { push } = useRouter()

  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft])

  async function handleResend() {


    const res = await forgotPassword({ email });
    const { result, response } = res;

    if (response?.ok) {
      addToast({
        title: "Email Sent",
        description: `Please check your email for the password reset link.`,
        color: 'success',
      });
      setSecondsLeft(120)
      setCanResend(false)
    } else {
      setError(response?.message || "Unknown error");
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = formData.get('code') as string
    const password = formData.get('password') as string
    const repeatPassword = formData.get('repeat-password') as string

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      addToast({
        title: 'Passwords do not match',
        color: 'danger'
      })
      setIsLoading(false)
      return
    }

    if (code.length !== 4) {
      setError('Please enter the verification code')
      addToast({
        title: 'Please enter the verification code',
        color: 'danger'
      })
      setIsLoading(false)
      return
    }

    const res = await resetPassword({ email, code, password })
    const { result, response } = res

    if (response?.ok) {
      addToast({
        title: 'Your password has been reset',
        color: 'success'
      })
      push(`/auth/sign-in?email=${email}`)
    } else {
      setError(response?.message || 'Unknown error')
    }

    setIsLoading(false)
  }

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="text-3xl font-semibold text-white">Reset Password</div>

      <form
        ref={formRef}
        onSubmit={handleRegister}
        className="flex mt-8 flex-col items-stretch gap-4"
      >
        <div className="w-full flex items-center gap-2">
          <span>We have sent a verification code to your email:</span>
          <span className="text-primary text-sm font-semibold">
            {canResend ? (
              <Button
                variant='light'
                color='primary'
                type="button"
                onClick={handleResend}
                className="underline font-semibold"
              >
                Resend
              </Button>
            ) : (
              `Resend in ${secondsLeft}s`
            )}
          </span>
        </div>

        <div className="text-secondary-500 justify-center flex items-center gap-1 w-full text-center">
          <span className="relative">
            {email}
            <Link
              className="absolute left-full translate-x-1 -translate-y-1/2 top-1/2"
              href={`/auth/forgot-password?email=${email}`}
            >
              <Button variant="light" color="primary" className="!px-2" size="sm">
                <SquarePen size={16} />
              </Button>
            </Link>
          </span>
        </div>

        <InputOtp
          name="code"
          defaultValue={code}
          className="mx-auto"
          size="lg"
          length={4}
        />
        <Input
          name="password"
          label="New Password"
          type="password"
          autoComplete="new-password"
        />
        <Input
          name="repeat-password"
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <Button isLoading={isLoading} isDisabled={isLoading} type="submit" color="secondary">
          Reset Password
        </Button>

        <Link href={'/auth/sign-in'} className="w-full">
          <Button type="button" color="default" className="w-full">
            Back to log in page
          </Button>
        </Link>
      </form>
    </div>
  )
}
