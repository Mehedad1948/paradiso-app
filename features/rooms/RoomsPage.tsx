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
    <div className="py-8">
      <div className="py-4">
        <Button onPress={create}>Create Room</Button>
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
