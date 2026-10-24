"use client";
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { Bookmark, KeyRound, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { authApi } from "@/lib/api/auth";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import type { CurrentUser } from "@/types/user";
import ProfileForm from "./components/ProfileForm";
import PasswordForm from "./components/PasswordForm";
import WatchlistPanel from "@/features/watchlist/WatchlistPanel";
import { underlinedTabs } from "./tabs";

type Section = "profile" | "password" | "watchlist";
type FormSection = Exclude<Section, "watchlist">;
const forms: Record<FormSection, { id: string; submit: string }> = {
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
  const [ready, setReady] = useState<Record<FormSection, boolean>>({
    profile: false,
    password: false,
  });
  // The watchlist has nothing to save, so it gets no submit button.
  const form = section === "watchlist" ? null : forms[section];
  const onReady = useMemo(() => {
    const setter = (key: FormSection) => (value: boolean) =>
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
            {form ? "Cancel" : "Close"}
          </Button>
          {form && (
            <Button
              type="submit"
              form={form.id}
              className="bg-ink font-semibold text-canvas"
              isLoading={busy}
              isDisabled={!ready[section as FormSection]}
            >
              {form.submit}
            </Button>
          )}
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
        <Tab
          key="watchlist"
          title={
            <span className="flex items-center gap-2">
              <Bookmark size={16} aria-hidden="true" /> Watchlist
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
      {section === "watchlist" && <WatchlistPanel />}
    </Sidebar>
  );
}
