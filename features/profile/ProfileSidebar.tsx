"use client";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { KeyRound, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { authApi } from "@/lib/api/auth";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import type { CurrentUser } from "@/types/user";
import ProfileForm from "./components/ProfileForm";
import PasswordForm from "./components/PasswordForm";
import { underlinedTabs } from "./tabs";

type Section = "profile" | "password";
const forms: Record<Section, { id: string; submit: string }> = {
  profile: { id: "profile-form", submit: "Save changes" },
  password: { id: "password-form", submit: "Update password" },
};

/** The signed-in user's account panel: profile details and password in separate tabs. */
export default function ProfileSidebar({
  user,
  onClose,
}: {
  user: CurrentUser;
  onClose: () => void;
}) {
  const sidebar = useSidebar(onClose);
  const router = useRouter();
  const signOut = useAuthForm(authApi.signOut, true);
  const [section, setSection] = useState<Section>("profile");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<Record<Section, boolean>>({
    profile: false,
    password: false,
  });
  const form = forms[section];
  const onReady = useMemo(() => {
    const setter = (key: Section) => (value: boolean) =>
      setReady((current) => (current[key] === value ? current : { ...current, [key]: value }));
    return { profile: setter("profile"), password: setter("password") };
  }, []);

  return (
    <Sidebar
      ref={sidebar.ref}
      title="Your account"
      description={user.email}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button
            variant="flat"
            color="danger"
            className="mr-auto bg-danger-500/10 font-semibold text-danger-500 hover:bg-danger-500/20"
            startContent={!signOut.isPending && <LogOut size={16} aria-hidden="true" />}
            isLoading={signOut.isPending}
            isDisabled={busy || signOut.isPending}
            onPress={() => {
              void signOut.submit(undefined, () =>
                router.replace("/auth/sign-in?reason=signed-out"),
              );
            }}
          >
            Sign out
          </Button>
          <Button variant="light" isDisabled={busy} onPress={sidebar.close}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={form.id}
            className="bg-ink font-semibold text-canvas"
            isLoading={busy}
            isDisabled={!ready[section]}
          >
            {form.submit}
          </Button>
        </>
      }
    >
      {signOut.error && (
        <p role="alert" className="mb-3 text-sm text-danger-500">
          {signOut.error}
        </p>
      )}
      <Tabs
        fullWidth
        variant="underlined"
        aria-label="Account sections"
        selectedKey={section}
        onSelectionChange={(key) => setSection(key as Section)}
        isDisabled={busy}
        className="mb-2"
        classNames={underlinedTabs}
      >
        <Tab
          key="profile"
          title={
            <span className="flex items-center gap-2">
              <UserRound size={16} aria-hidden="true" /> Profile
            </span>
          }
        />
        <Tab
          key="password"
          title={
            <span className="flex items-center gap-2">
              <KeyRound size={16} aria-hidden="true" /> Password
            </span>
          }
        />
      </Tabs>
      {/* Both stay mounted so unsaved edits survive switching tabs. */}
      <div hidden={section !== "profile"}>
        <ProfileForm
          id={forms.profile.id}
          user={user}
          onBusyChange={setBusy}
          onReadyChange={onReady.profile}
          onSaved={sidebar.close}
        />
      </div>
      <div hidden={section !== "password"}>
        <PasswordForm
          id={forms.password.id}
          onBusyChange={setBusy}
          onReadyChange={onReady.password}
          onSaved={sidebar.close}
        />
      </div>
    </Sidebar>
  );
}
