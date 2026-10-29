"use client";
import UserAvatar from "@/components/ui/UserAvatar";
import { useMe } from "@/hooks/queries/useMe";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/features/notifications/NotificationBell";

function ChatLikeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.4606 1.25H13.5394C15.1427 1.24999 16.3997 1.24999 17.4039 1.34547C18.4274 1.44279 19.2655 1.64457 20.0044 2.09732C20.7781 2.57144 21.4286 3.22194 21.9027 3.99563C22.3554 4.73445 22.5572 5.57256 22.6545 6.59611C22.75 7.60029 22.75 8.85725 22.75 10.4606V11.5278C22.75 12.6691 22.75 13.564 22.7007 14.2868C22.6505 15.0223 22.5468 15.6344 22.3123 16.2004C21.7287 17.6093 20.6093 18.7287 19.2004 19.3123C18.3955 19.6457 17.4786 19.7197 16.2233 19.7413C15.7842 19.7489 15.5061 19.7545 15.2941 19.7779C15.096 19.7999 15.0192 19.832 14.9742 19.8582C14.9268 19.8857 14.8622 19.936 14.7501 20.0898C14.6287 20.2564 14.4916 20.4865 14.2742 20.8539L13.7321 21.7697C12.9585 23.0767 11.0415 23.0767 10.2679 21.7697L9.72579 20.8539C9.50835 20.4865 9.37122 20.2564 9.24985 20.0898C9.13772 19.936 9.07313 19.8857 9.02572 19.8582C8.98078 19.832 8.90399 19.7999 8.70588 19.7779C8.49387 19.7545 8.21575 19.7489 7.77666 19.7413C6.52138 19.7197 5.60454 19.6457 4.79957 19.3123C3.39066 18.7287 2.27128 17.6093 1.68769 16.2004C1.45323 15.6344 1.3495 15.0223 1.29932 14.2868C1.24999 13.564 1.25 12.6691 1.25 11.5278L1.25 10.4606C1.24999 8.85726 1.24999 7.60029 1.34547 6.59611C1.44279 5.57256 1.64457 4.73445 2.09732 3.99563C2.57144 3.22194 3.22194 2.57144 3.99563 2.09732C4.73445 1.64457 5.57256 1.44279 6.59611 1.34547C7.60029 1.24999 8.85726 1.24999 10.4606 1.25ZM6.73809 2.83873C5.82434 2.92561 5.24291 3.09223 4.77938 3.37628C4.20752 3.72672 3.72672 4.20752 3.37628 4.77938C3.09223 5.24291 2.92561 5.82434 2.83873 6.73809C2.75079 7.663 2.75 8.84876 2.75 10.5V11.5C2.75 12.6751 2.75041 13.5189 2.79584 14.1847C2.84081 14.8438 2.92737 15.2736 3.07351 15.6264C3.50486 16.6678 4.33223 17.4951 5.3736 17.9265C5.88923 18.1401 6.54706 18.2199 7.8025 18.2416L7.83432 18.2421C8.23232 18.249 8.58109 18.2549 8.87097 18.287C9.18246 18.3215 9.4871 18.3912 9.77986 18.5615C10.0702 18.7304 10.2795 18.9559 10.4621 19.2063C10.6307 19.4378 10.804 19.7306 11.0004 20.0623L11.5587 21.0057C11.7515 21.3313 12.2485 21.3313 12.4412 21.0057L12.9996 20.0623C13.1959 19.7306 13.3692 19.4378 13.5379 19.2063C13.7204 18.9559 13.9298 18.7304 14.2201 18.5615C14.5129 18.3912 14.8175 18.3215 15.129 18.287C15.4189 18.2549 15.7676 18.249 16.1656 18.2421L16.1975 18.2416C17.4529 18.2199 18.1108 18.1401 18.6264 17.9265C19.6678 17.4951 20.4951 16.6678 20.9265 15.6264C21.0726 15.2736 21.1592 14.8438 21.2042 14.1847C21.2496 13.5189 21.25 12.6751 21.25 11.5V10.5C21.25 8.84876 21.2492 7.663 21.1613 6.73809C21.0744 5.82434 20.9078 5.24291 20.6237 4.77938C20.2733 4.20752 19.7925 3.72672 19.2206 3.37628C18.7571 3.09223 18.1757 2.92561 17.2619 2.83873C16.337 2.75079 15.1512 2.75 13.5 2.75H10.5C8.84876 2.75 7.663 2.75079 6.73809 2.83873ZM15.272 6.42848C16.507 6.89026 17.25 8.14531 17.25 9.71474C17.25 10.8757 16.5511 11.9574 15.8168 12.7961C15.0591 13.6614 14.1381 14.4085 13.4549 14.912C13.4283 14.9316 13.4015 14.9515 13.3745 14.9716C13.0029 15.2478 12.5824 15.5603 12 15.5603C11.4176 15.5603 10.9972 15.2478 10.6255 14.9716C10.5985 14.9515 10.5717 14.9316 10.5451 14.912C9.86191 14.4085 8.94088 13.6614 8.18323 12.7961C7.44886 11.9574 6.75 10.8757 6.75 9.71476C6.75 8.14532 7.49299 6.89027 8.72797 6.42848C9.77086 6.03852 10.9575 6.29174 12 7.10194C13.0425 6.29174 14.2291 6.03852 15.272 6.42848ZM14.7467 7.83347C14.2295 7.64009 13.4049 7.74331 12.5359 8.63085C12.3948 8.77494 12.2017 8.85614 12 8.85614C11.7983 8.85614 11.6052 8.77494 11.4641 8.63085C10.5951 7.7433 9.77052 7.64009 9.25333 7.83347C8.74454 8.02372 8.25 8.60702 8.25 9.71476C8.25 10.3064 8.63279 11.0325 9.31176 11.808C9.96746 12.5568 10.7914 13.2302 11.435 13.7045C11.678 13.8835 11.8008 13.972 11.899 14.0252C11.9645 14.0606 11.9832 14.0604 11.9976 14.0603C11.9984 14.0603 11.9992 14.0603 12 14.0603C12.0008 14.0603 12.0016 14.0603 12.0024 14.0603C12.0168 14.0604 12.0355 14.0606 12.101 14.0252C12.1992 13.972 12.322 13.8835 12.565 13.7045C13.2086 13.2302 14.0325 12.5568 14.6882 11.808C15.3672 11.0325 15.75 10.3064 15.75 9.71474C15.75 8.60701 15.2555 8.02372 14.7467 7.83347Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0.6}
      />
    </svg>
  );
}

function ClapperboardPlayIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.9426 1.25H12.0574C14.3658 1.24999 16.1748 1.24998 17.5863 1.43975C19.031 1.63399 20.1711 2.03933 21.0659 2.93414C21.9607 3.82895 22.366 4.96897 22.5603 6.41371C22.75 7.82519 22.75 9.63423 22.75 11.9426V12.0574C22.75 14.3658 22.75 16.1748 22.5603 17.5863C22.366 19.031 21.9607 20.1711 21.0659 21.0659C20.1711 21.9607 19.031 22.366 17.5863 22.5603C16.1748 22.75 14.3658 22.75 12.0574 22.75H11.9426C9.63423 22.75 7.82519 22.75 6.41371 22.5603C4.96897 22.366 3.82895 21.9607 2.93414 21.0659C2.03933 20.1711 1.63399 19.031 1.43975 17.5863C1.24998 16.1748 1.24999 14.3658 1.25 12.0574V11.9426C1.24999 9.63423 1.24998 7.82519 1.43975 6.41371C1.63399 4.96897 2.03933 3.82895 2.93414 2.93414C3.82895 2.03933 4.96897 1.63399 6.41371 1.43975C7.82519 1.24998 9.63423 1.24999 11.9426 1.25ZM6.61358 2.92637C5.33517 3.09825 4.56445 3.42514 3.9948 3.9948C3.42514 4.56445 3.09825 5.33517 2.92637 6.61358C2.89922 6.81554 2.87624 7.02735 2.85681 7.25H6.58829L9.44439 2.76185C8.31691 2.77915 7.39205 2.82171 6.61358 2.92637ZM11.2072 2.75032C11.1886 2.80268 11.1638 2.85379 11.1327 2.90266L8.36626 7.25H13.0883L15.9189 2.80191C14.8557 2.7507 13.5747 2.75 12 2.75C11.727 2.75 11.4629 2.75002 11.2072 2.75032ZM17.5982 2.95698L14.8663 7.25H21.1432C21.1238 7.02735 21.1008 6.81554 21.0736 6.61358C20.9018 5.33517 20.5749 4.56445 20.0052 3.9948C19.4677 3.45731 18.7512 3.13594 17.5982 2.95698ZM21.2233 8.75H13.5112C13.5033 8.75013 13.4953 8.75013 13.4874 8.75H7.01122C7.00327 8.75013 6.99532 8.75013 6.98737 8.75H2.77672C2.75045 9.67173 2.75 10.7422 2.75 12C2.75 14.3782 2.75159 16.0864 2.92637 17.3864C3.09825 18.6648 3.42514 19.4355 3.9948 20.0052C4.56445 20.5749 5.33517 20.9018 6.61358 21.0736C7.91356 21.2484 9.62177 21.25 12 21.25C14.3782 21.25 16.0864 21.2484 17.3864 21.0736C18.6648 20.9018 19.4355 20.5749 20.0052 20.0052C20.5749 19.4355 20.9018 18.6648 21.0736 17.3864C21.2484 16.0864 21.25 14.3782 21.25 12C21.25 10.7422 21.2496 9.67173 21.2233 8.75ZM13.3682 11.9212L13.4699 11.9868C14.0897 12.3866 14.6263 12.7328 15.0004 13.0636C15.3983 13.4156 15.75 13.8686 15.75 14.5C15.75 15.1314 15.3983 15.5844 15.0004 15.9364C14.6263 16.2671 14.0897 16.6133 13.4699 17.0132L13.3682 17.0788C12.7421 17.4828 12.1979 17.834 11.7459 18.0347C11.2756 18.2435 10.673 18.394 10.0982 18.0289C9.55356 17.6828 9.38842 17.0922 9.31912 16.5722C9.24994 16.053 9.24996 15.3674 9.25 14.5549V14.4451C9.24996 13.6326 9.24994 12.947 9.31912 12.4278C9.38842 11.9078 9.55356 11.3172 10.0982 10.9711C10.673 10.606 11.2756 10.7565 11.7459 10.9653C12.1979 11.166 12.7421 11.5172 13.3682 11.9212ZM10.8579 12.2517C10.8573 12.2509 10.862 12.2496 10.8737 12.2504C10.8644 12.2529 10.8585 12.2525 10.8579 12.2517ZM10.8971 12.2532C10.9373 12.2601 11.0119 12.2806 11.1372 12.3362C11.4688 12.4834 11.9134 12.7677 12.6073 13.2154C13.2907 13.6564 13.7285 13.9413 14.0066 14.1873C14.2627 14.4137 14.251 14.4932 14.25 14.4996C14.251 14.5061 14.2627 14.5863 14.0066 14.8127C13.7285 15.0587 13.2907 15.3436 12.6073 15.7846C11.9134 16.2323 11.4688 16.5166 11.1372 16.6638C11.0119 16.7194 10.9373 16.7399 10.8971 16.7468C10.8749 16.704 10.8362 16.6006 10.806 16.3741C10.7516 15.9662 10.75 15.3821 10.75 14.5C10.75 13.6179 10.7516 13.0338 10.806 12.6259C10.8362 12.3994 10.8749 12.296 10.8971 12.2532ZM10.8579 16.7483C10.8585 16.7475 10.8644 16.7472 10.8737 16.7496C10.862 16.7504 10.8573 16.7491 10.8579 16.7483ZM10.9101 16.7682C10.9135 16.7711 10.915 16.7731 10.9149 16.7733C10.9148 16.7736 10.9131 16.7722 10.9101 16.7682ZM10.9101 12.2318C10.9131 12.2278 10.9148 12.2264 10.9149 12.2267C10.915 12.2269 10.9135 12.2289 10.9101 12.2318Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0.6}
      />
    </svg>
  );
}

const loadProfileSidebar =() => import("@/features/profile/ProfileSidebar");
// ssr: false gives it its own Suspense boundary, so loading the chunk never suspends the header.
const ProfileSidebar = dynamic(loadProfileSidebar, { ssr: false });

export default function Header() {
  const { data: user, isPending } = useMe();
  const [profileOpen, setProfileOpen] = useState(false);
  const signedIn = !!user;
  // Hover/focus preloading never fires before a tap on touch screens, so also fetch the menu
  // once the browser is idle after sign-in is known.
  useEffect(() => {
    if (!signedIn) return;
    // Safari < 16.4 lacks requestIdleCallback.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => void loadProfileSidebar(), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(() => void loadProfileSidebar(), 2000);
    return () => window.clearTimeout(timer);
  }, [signedIn]);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const navLink = (href: string) =>
    clsx(
      "group relative inline-flex h-10 items-center justify-center gap-2 px-2.5 transition-colors duration-200 max-md:w-9 max-md:px-0",
      "after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:origin-center after:rounded-full after:bg-accent after:transition-transform after:duration-200 max-md:after:inset-x-1.5",
      isActive(href)
        ? "text-ink after:scale-x-100"
        : "text-muted after:scale-x-0 hover:text-ink hover:after:scale-x-50",
    );

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-line bg-canvas/80 px-[4.5vw] text-ink backdrop-blur-xl max-md:px-[4vw]">
      <nav aria-label="Main navigation" className="mx-auto flex h-[88px] max-w-[1600px] flex-nowrap items-center justify-between gap-3 max-md:h-[72px]">
        <Logo className="shrink-0" />

        <div className="flex min-w-0 items-center gap-2 text-[15px] font-semibold max-[480px]:gap-1.5">
          <div className="mr-1 flex items-center gap-1 max-md:mr-0 max-md:gap-0.5">
            <Link href="/community" aria-label="Lobby" title="Lobby" aria-current={isActive("/community") ? "page" : undefined} className={navLink("/community")}>
              <ChatLikeIcon size={20} />
              <span className="max-md:hidden">Lobby</span>
            </Link>
            <Link href="/rooms" aria-label="Rooms" title="Rooms" aria-current={isActive("/rooms") ? "page" : undefined} className={navLink("/rooms")}>
              <ClapperboardPlayIcon size={20} />
              <span className="max-md:hidden">Rooms</span>
            </Link>
          </div>
          <InstallAppButton className="max-[480px]:size-9" />
          <ThemeSwitch className="max-[480px]:size-9" />
          {user && <NotificationBell className="max-[480px]:size-9" />}
          {user ? (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                onPointerEnter={loadProfileSidebar}
                onFocus={loadProfileSidebar}
                aria-haspopup="dialog"
                aria-label="Open your account"
                className="group flex items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent max-md:pr-0.5"
              >
                <UserAvatar
                  name={user.username}
                  src={user.avatar}
                  size={40}
                  alt=""
                  className="ring-2 ring-line transition-shadow group-hover:ring-accent"
                />
                <span className="max-w-[130px] truncate border-b border-transparent transition-colors group-hover:border-ink max-lg:hidden">
                  {user.username}
                </span>
              </button>
            </div>
          ) : isPending ? (
            <span aria-label="Loading" className="size-10 animate-pulse rounded-full bg-surface max-[480px]:size-9" />
          ) : (
            <Link
              href="/auth/sign-in"
              aria-label="Sign in"
              title="Sign in"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-opacity hover:opacity-85 max-[480px]:size-9"
            >
              <LogIn size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
      </nav>
      {user && profileOpen && (
        <ProfileSidebar user={user} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
