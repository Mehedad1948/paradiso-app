
'use client'

import { useRef, useEffect } from 'react';
import type { CinemaScene } from './cinema-scene';
import { ArrowUpRight } from 'lucide-react';
import { posters } from '@/config/posters';
import UserAvatar from '@/components/ui/UserAvatar';

const InvitationCard = ({
  roomImage = posters.fellowship,
  roomName = 'Your screening room',
  inviterName = 'A fellow film lover',
  inviterAvatar = '',
  isValidToken = true,
  isPending = false,
  error = '',
  onAccept = () => {},
  onDecline = () => {},
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CinemaScene | null>(null);

  // Three.js is loaded after the card renders so it stays off the critical path.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    void import('./cinema-scene').then(({ createCinemaScene }) => {
      if (!cancelled) sceneRef.current = createCinemaScene(mount);
    });
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center bg-canvas px-[4.5vw] pb-12 pt-32 text-ink max-[480px]:px-[5vw] max-[480px]:pb-8 max-[480px]:pt-36">
      <div className="pointer-events-none fixed inset-0 z-[1] h-svh w-full" ref={mountRef} aria-hidden="true" />
      <div className="relative z-[2] w-full max-w-[960px] overflow-hidden rounded-xl border border-line bg-elevated/95 shadow-[0_24px_60px_rgb(0_0_0_/_12%)] backdrop-blur-[20px] transition-[transform,border-color] duration-[400ms] hover:-translate-y-1 hover:border-accent motion-reduce:transform-none motion-reduce:transition-none" onMouseEnter={() => sceneRef.current?.setHighlight(true)} onMouseLeave={() => sceneRef.current?.setHighlight(false)}>
        {isValidToken ? (
          <div className="grid grid-cols-[1fr_1.1fr] gap-9 p-7 max-md:grid-cols-1 max-md:gap-6 max-md:p-6 max-[480px]:p-5">
            <div className="min-h-[440px] overflow-hidden rounded-md bg-surface max-md:h-60 max-md:min-h-0">
              <img src={roomImage} alt={roomName} className="h-full w-full object-cover" onError={(event) => {
                if (event.currentTarget.getAttribute("src") !== posters.fellowship) event.currentTarget.src = posters.fellowship;
              }} />
            </div>
            <div className="flex min-w-0 flex-col items-start justify-center py-3.5 max-md:py-0">
              <p className="mb-5 text-sm font-semibold text-accent">A seat has your name on it</p>
              <h1 className="mb-5 break-words text-[clamp(32px,4.2vw,52px)] font-semibold tracking-[-0.055em]">{roomName}</h1>
              <p className="mb-7 text-base leading-[1.7] text-muted">Great stories deserve good company. You’re invited to join the circle.</p>
              <div className="mb-8 flex w-full items-center gap-4 rounded-lg border border-line bg-surface p-4">
                <UserAvatar src={inviterAvatar} name={inviterName} size={48} className="shrink-0" />
                <div><p className="text-sm text-muted">Invited by</p><p className="break-words text-[17px] font-semibold text-ink">{inviterName}</p></div>
              </div>
              <div className="flex w-full flex-wrap gap-3 max-[480px]:flex-col">
                <button type="button" className="inline-flex flex-1 cursor-pointer items-center justify-center gap-4 rounded-md bg-ink px-4.5 py-3.5 text-[15px] font-semibold text-canvas hover:bg-accent hover:text-on-accent disabled:cursor-wait disabled:opacity-70" onClick={onAccept} disabled={isPending}>{isPending ? 'Joining…' : 'Accept and join'} <ArrowUpRight size={19} aria-hidden="true" /></button>
                <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-4 rounded-md border border-line bg-surface px-4.5 py-3.5 text-[15px] font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-70" onClick={onDecline} disabled={isPending}>Decline</button>
              </div>
              {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="p-10 [&>h1]:mb-6 [&>h1]:text-4xl [&>p]:text-base [&>p]:text-muted" role="alert"><h1>This invitation has ended.</h1><p>Request a fresh invitation from the room’s host and we’ll save you a seat.</p></div>
        )}
      </div>
    </div>
  );
};

export default InvitationCard;
