"use client";
import dynamic from "next/dynamic";
import { useCallback } from "react";
import { Button } from "@heroui/button";
import { useMe } from "@/hooks/queries/useMe";
import { useRoomUrl } from "./hooks/useRoomUrl";
import { useRoomDialog } from "./hooks/useRoomDialog";
import { positivePage } from "./state/filters";
import RoomListSection from "./components/RoomListSection";
import DialogLoading from "./components/DialogLoading";
import { Plus } from "lucide-react";
const CreateRoomDialog = dynamic(() => import("./dialogs/CreateRoomDialog"), {
  ssr: false,
  loading: DialogLoading,
});
export default function RoomsPage() {
  const { params, update } = useRoomUrl();
  const { dialog, open, close } = useRoomDialog();
  const { data: user } = useMe();
  const setMyPage = useCallback(
    (page: number) => update({ myPage: page === 1 ? null : page }),
    [update],
  );
  const setAllPage = useCallback(
    (page: number) => update({ allPage: page === 1 ? null : page }),
    [update],
  );
  const create = useCallback(() => open("create-room"), [open]);
  return (
    <div>
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-9 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:pb-7 max-sm:[&>button]:w-full">
        <div>
          <p className="mb-3.5 text-sm font-semibold uppercase tracking-[0.09em] text-accent">Your cinema, together</p>
          <h1 className="mb-4 break-words text-[clamp(36px,4.8vw,68px)] tracking-[-0.06em] [&_em]:font-serif [&_em]:font-normal max-sm:text-[38px]">
            Make room for
            <br />
            <em>good cinema.</em>
          </h1>
          <p className="max-w-[540px] text-base text-muted">
            Gather your people, build a watchlist, and find the next film worth
            sharing.
          </p>
        </div>
        <Button
          className="min-h-[46px] rounded-md bg-ink text-[15px] font-semibold text-canvas"
          onPress={create}
          startContent={<Plus size={20} aria-hidden="true" />}
        >
          Create a room
        </Button>
      </div>
      <RoomListSection
        usersRoom
        page={positivePage(params.get("myPage"))}
        onPage={setMyPage}
        onCreate={create}
        userId={user?.id}
      />
      <RoomListSection
        usersRoom={false}
        page={positivePage(params.get("allPage"))}
        onPage={setAllPage}
        onCreate={create}
        userId={user?.id}
      />
      {dialog === "create-room" && <CreateRoomDialog onClose={close} />}
    </div>
  );
}
