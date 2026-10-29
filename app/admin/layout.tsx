import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Spinner } from "@heroui/spinner";
import AdminShell from "@/features/admin/AdminShell";
import { authHref } from "@/lib/auth/redirect";
import { accessTokenRole } from "@/lib/auth/session";
import users from "@/services/user";

/** Not indexed, and never linked from the site: admins type the address. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Paradiso admin" },
  robots: { index: false, follow: false },
};

/**
 * The only gate that matters is the backend's role check on every call. This one keeps everyone
 * else from even seeing that the area exists: a signed-in member who is not an admin gets the
 * site's ordinary 404.
 */
async function AdminGate({ children }: { children: ReactNode }) {
  const me = await users.getMe();
  if (me.response.status === 401)
    redirect(authHref("sign-in", { origin: "/admin", refresh: "true", reason: "session-expired" }));
  if (!me.response.ok || !me.result) throw new Error("The admin area could not check your account. Try again.");
  // /users/me does not return the role, so it is read from the signed access token, as the proxy does.
  const role = me.result.role ?? (await accessTokenRole((await cookies()).get("token")?.value));
  if (role !== "admin") notFound();
  return <AdminShell username={me.result.username}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Spinner className="p-12" aria-label="Checking access" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
