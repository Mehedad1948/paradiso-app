"use client";
import { startTransition, useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { LockIcon } from "@solar-icons/react/linear";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { startResetCooldown, useResendCooldown } from "@/hooks/auth/useResendCooldown";
import { confirmPassword } from "@/lib/auth/validation";
import { syncSession } from "@/lib/auth/sync-session";
import { panelKeys } from "@/lib/query/panel-keys";
import AuthFeedback from "@/components/auth/AuthFeedback";
import AuthOtpInput from "@/components/auth/AuthOtpInput";
import PasswordInput from "@/components/auth/PasswordInput";

export type FlowView = "sign-in" | "register" | "verify" | "forgot" | "reset";

interface Flow {
  email: string;
  setEmail: (email: string) => void;
  /** A line from the previous step, e.g. "Password reset". */
  notice: string | null;
  go: (view: FlowView, notice?: string) => void;
  /** A session now exists: refresh the page's data. The gate closes itself once the viewer loads. */
  done: () => Promise<void>;
  /** The session is being applied to the page; keep the form locked. */
  syncing: boolean;
  failure: string | null;
}

const FORM =
  "flex flex-col gap-4 [&_[data-slot=input-wrapper]]:border [&_[data-slot=input-wrapper]]:border-line [&_[data-slot=input-wrapper]]:bg-surface [&_[data-slot=input-wrapper]]:shadow-none [&_button]:font-semibold";
const LINK = "text-sm font-medium text-accent underline-offset-4 hover:underline disabled:opacity-50";

/** The whole account flow, held in state instead of the URL so the page behind never changes. */
export default function AuthFlow({ initialView, reason }: { initialView: "sign-in" | "register"; reason?: string }) {
  const client = useQueryClient();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<FlowView>(initialView);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const go = useCallback((next: FlowView, message?: string) => {
    setNotice(message ?? null);
    setView(next);
  }, []);

  const done = useCallback(async () => {
    setSyncing(true);
    setFailure(null);
    try {
      await syncSession(client, () => startTransition(() => router.refresh()));
    } catch {
      /* Reported below, the same as a viewer that never loaded. */
    }
    setSyncing(false);
    if (!client.getQueryData(panelKeys.me))
      setFailure("You're signed in, but the page couldn't update. Reload it to continue.");
  }, [client, router]);

  const flow: Flow = { email, setEmail, notice, go, done, syncing, failure };
  // Only the first two steps explain why the dialog appeared.
  const eyebrow = reason && (view === "sign-in" || view === "register") ? reason : undefined;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={view}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {eyebrow && (
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
            <LockIcon size={14} aria-hidden="true" /> {eyebrow}
          </p>
        )}
        {view === "sign-in" && <SignInView flow={flow} />}
        {view === "register" && <RegisterView flow={flow} />}
        {view === "verify" && <VerifyView flow={flow} />}
        {view === "forgot" && <ForgotView flow={flow} />}
        {view === "reset" && <ResetView flow={flow} />}
      </motion.div>
    </AnimatePresence>
  );
}

function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <h2 className="text-[clamp(28px,3vw,36px)] font-semibold tracking-[-0.05em]">{title}</h2>
      {children && <p className="mt-2 text-[15px] text-muted">{children}</p>}
    </header>
  );
}

function EmailField({ flow, disabled, onChange }: { flow: Flow; disabled: boolean; onChange?: () => void }) {
  return (
    <Input
      name="email"
      label="Email"
      labelPlacement="outside"
      placeholder=" "
      type="email"
      autoComplete="email"
      isRequired
      isDisabled={disabled}
      value={flow.email}
      onValueChange={(value) => {
        flow.setEmail(value);
        onChange?.();
      }}
    />
  );
}

function SignInView({ flow }: { flow: Flow }) {
  const form = useAuthForm(authApi.signIn);
  const busy = form.isPending || flow.syncing;
  return (
    <>
      <Heading title="Take your seat">{flow.notice ?? "Sign in to Paradiso."}</Heading>
      <form
        ref={form.formRef}
        className={FORM}
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          void form.submit({ email: flow.email, password: String(fields.get("password") || "") }, () => void flow.done());
        }}
      >
        <EmailField flow={flow} disabled={busy} onChange={form.clearError} />
        <PasswordInput
          name="password"
          label="Password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="current-password"
          isRequired
          isDisabled={busy}
          onValueChange={() => form.clearError()}
        />
        <button type="button" className={`${LINK} self-start`} disabled={busy} onClick={() => flow.go("forgot")}>
          Forgot your password?
        </button>
        <AuthFeedback error={form.error || flow.failure} />
        <Button type="submit" color="secondary" isLoading={busy} isDisabled={busy}>
          Sign in
        </Button>
        <p className="text-center text-sm text-muted">
          New to Paradiso?{" "}
          <button type="button" className={LINK} disabled={busy} onClick={() => flow.go("register")}>
            Create an account
          </button>
        </p>
      </form>
    </>
  );
}

function RegisterView({ flow }: { flow: Flow }) {
  const form = useAuthForm(authApi.register);
  return (
    <>
      <Heading title="Join Paradiso">Good films. Better company.</Heading>
      <form
        ref={form.formRef}
        className={FORM}
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const password = String(fields.get("password") || "");
          try {
            confirmPassword(password, String(fields.get("confirmPassword") || ""));
          } catch (error) {
            form.setError((error as Error).message);
            return;
          }
          void form.submit({ email: flow.email, password, username: String(fields.get("username") || "") }, () =>
            flow.go("verify", "Account created. Enter the four-digit code we emailed you."),
          );
        }}
      >
        <Input
          name="username"
          label="Username"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="username"
          isRequired
          maxLength={100}
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <EmailField flow={flow} disabled={form.isPending} onChange={form.clearError} />
        <PasswordInput
          name="password"
          label="Password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="new-password"
          isRequired
          minLength={6}
          maxLength={128}
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <PasswordInput
          name="confirmPassword"
          label="Confirm password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="new-password"
          isRequired
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <AuthFeedback error={form.error} />
        <Button type="submit" color="secondary" isLoading={form.isPending} isDisabled={form.isPending}>
          Create account
        </Button>
        <p className="text-center text-sm text-muted">
          Already a member?{" "}
          <button type="button" className={LINK} disabled={form.isPending} onClick={() => flow.go("sign-in")}>
            Sign in
          </button>
        </p>
      </form>
    </>
  );
}

function VerifyView({ flow }: { flow: Flow }) {
  const form = useAuthForm(authApi.verify);
  const [code, setCode] = useState("");
  const busy = form.isPending || flow.syncing;
  return (
    <>
      <Heading title="Verify your email">{flow.notice ?? "Enter the four-digit code sent to your email."}</Heading>
      <form
        ref={form.formRef}
        className={FORM}
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit({ email: flow.email, code }, (result) => {
            if (result.authenticated) void flow.done();
            else flow.go("sign-in", "Your email is verified. Sign in to continue.");
          });
        }}
      >
        <EmailField flow={flow} disabled={busy} onChange={form.clearError} />
        <AuthOtpInput
          name="code"
          aria-label="Email verification code"
          autoComplete="one-time-code"
          length={4}
          value={code}
          isDisabled={busy}
          onValueChange={(value) => {
            setCode(value);
            form.clearError();
          }}
        />
        <AuthFeedback error={form.error || flow.failure} />
        <Button type="submit" color="secondary" isLoading={busy} isDisabled={busy}>
          Verify email
        </Button>
        <button type="button" className={LINK} disabled={busy} onClick={() => flow.go("sign-in")}>
          Back to sign in
        </button>
      </form>
    </>
  );
}

function ForgotView({ flow }: { flow: Flow }) {
  const form = useAuthForm(authApi.forgotPassword);
  return (
    <>
      <Heading title="Forgot password">Enter your email and we will send you a reset code.</Heading>
      <form
        ref={form.formRef}
        className={FORM}
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit({ email: flow.email }, () => {
            startResetCooldown(flow.email);
            flow.go("reset", "Check your email for the password reset code.");
          });
        }}
      >
        <EmailField flow={flow} disabled={form.isPending} onChange={form.clearError} />
        <AuthFeedback error={form.error} />
        <Button type="submit" color="secondary" isLoading={form.isPending} isDisabled={form.isPending}>
          Send reset code
        </Button>
        <button type="button" className={LINK} disabled={form.isPending} onClick={() => flow.go("sign-in")}>
          Back to sign in
        </button>
      </form>
    </>
  );
}

function ResetView({ flow }: { flow: Flow }) {
  const form = useAuthForm(authApi.resetPassword);
  const resend = useAuthForm(authApi.forgotPassword);
  const cooldown = useResendCooldown(flow.email);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(flow.notice);
  const busy = form.isPending || resend.isPending;
  return (
    <>
      <Heading title="Reset password">Enter the code we emailed you, then choose a new password.</Heading>
      <form
        ref={form.formRef}
        className={FORM}
        onSubmit={(event) => {
          event.preventDefault();
          resend.clearError();
          const fields = new FormData(event.currentTarget);
          const password = String(fields.get("password") || "");
          try {
            confirmPassword(password, String(fields.get("confirmPassword") || ""));
          } catch (error) {
            form.setError((error as Error).message);
            return;
          }
          void form.submit({ email: flow.email, code, password }, () =>
            flow.go("sign-in", "Your password has been reset. Sign in with the new one."),
          );
        }}
      >
        <EmailField
          flow={flow}
          disabled={busy}
          onChange={() => {
            form.clearError();
            resend.clearError();
            setMessage(null);
          }}
        />
        <AuthOtpInput
          name="code"
          aria-label="Password reset code"
          autoComplete="one-time-code"
          length={4}
          value={code}
          isDisabled={busy}
          onValueChange={(value) => {
            setCode(value);
            form.clearError();
          }}
        />
        <Button
          type="button"
          variant="light"
          color="primary"
          isLoading={resend.isPending}
          isDisabled={busy || cooldown.secondsLeft > 0}
          onPress={() => {
            form.clearError();
            void resend.submit({ email: flow.email }, (result) => {
              cooldown.start();
              setCode("");
              setMessage(result.message);
            });
          }}
        >
          {cooldown.secondsLeft > 0 ? `Resend code in ${cooldown.secondsLeft}s` : "Send another code"}
        </Button>
        <PasswordInput
          name="password"
          label="New password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="new-password"
          isRequired
          minLength={6}
          maxLength={128}
          isDisabled={busy}
          onValueChange={() => form.clearError()}
        />
        <PasswordInput
          name="confirmPassword"
          label="Confirm new password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="new-password"
          isRequired
          isDisabled={busy}
          onValueChange={() => form.clearError()}
        />
        <AuthFeedback error={form.error || resend.error} message={message} />
        <Button type="submit" color="secondary" isLoading={form.isPending} isDisabled={busy}>
          Reset password
        </Button>
        <button type="button" className={LINK} disabled={busy} onClick={() => flow.go("sign-in")}>
          Back to sign in
        </button>
      </form>
    </>
  );
}
