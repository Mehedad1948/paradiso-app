"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Fragment, useState } from "react";
import { addToast } from "@heroui/toast";
import { Chip } from "@heroui/chip";
import { statusColorPicker } from "@/utils/statusColorPicker";
import PanelPagination from "../components/PanelPagination";
import { Spinner } from "@heroui/spinner";
import {
  useInvitations,
  useInviteUser,
} from "@/hooks/queries/useInvitationQueries";
import QueryError from "@/components/ui/QueryError";
export default function InviteByEmail({ roomId }: { roomId: string }) {
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const query = useInvitations(roomId, page);
  const { execute, isPending: isLoading } = useInviteUser(roomId, {
    onSuccess: () => {
      addToast({
        title: `An invitation email was sent to ${email}`,
        color: "success",
      });
      setEmail("");
    },
  });
  return (
    <div>
      <form
        className="flex items-center gap-2 mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          execute({ email, roomId });
        }}
      >
        <Input
          value={email}
          isDisabled={isLoading}
          onValueChange={setEmail}
          type="email"
          isRequired
          aria-label="Email address"
        />
        <Button
          color="primary"
          type="submit"
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          Invite
        </Button>
      </form>
      <p className="font-semibold">Invitations</p>
      {query.isPending ? (
        <Spinner />
      ) : query.isError ? (
        <QueryError error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-[1fr,auto] mt-2 gap-y-3 items-center">
            {query.data.data.map((item) => (
              <Fragment key={item.id}>
                <span className="text-sm">{item.email}</span>
                <Chip
                  className="capitalize"
                  size="sm"
                  color={statusColorPicker(item.status)}
                >
                  {item.status}
                </Chip>
              </Fragment>
            ))}
          </div>
          <PanelPagination
            page={page}
            totalPages={query.data.meta.totalPages}
            onChange={setPage}
            disabled={query.isPlaceholderData}
          />
        </>
      )}
    </div>
  );
}
