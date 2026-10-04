"use client";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import PanelPagination from "../components/PanelPagination";
import { addToast } from "@heroui/toast";
import { Copy, Link } from "lucide-react";
import InviteLinkItem from "./InviteLinkItem";
import CopierButton from "@/components/utils/CopierButton";
import { useEffect, useState } from "react";
import {
  useInviteLinks,
  useCreateInviteLink,
} from "@/hooks/queries/useInvitationQueries";
import QueryError from "@/components/ui/QueryError";

export default function InviteByLink({ roomId }: { roomId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isPlaceholderData } =
    useInviteLinks(roomId, page);

  const { execute, isPending: isGenerating } = useCreateInviteLink(roomId, {
    onSuccess: () => {
      addToast({
        title: "Your link is ready to share!",
        color: "success",
      });
    },
  });

  const totalPages = Math.max(1, data?.meta.totalPages || 1);
  useEffect(() => {
    if (data && !isPlaceholderData && page > totalPages) setPage(totalPages);
  }, [data, isPlaceholderData, page, totalPages]);
  if (isError) return <QueryError error={error} retry={() => refetch()} />;

  return (
    <div>
      {data?.data && data?.data?.length > 0 && (
        <div className="mb-2">
          <Button
            onPress={() => !isGenerating && execute(roomId)}
            isLoading={isGenerating}
            isDisabled={isGenerating}
            size="sm"
            color="primary"
          >
            Create New Invite Link <Link className="w-4" />
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <Spinner />
        ) : data?.data && data?.data.length > 0 ? (
          <Accordion>
            {data.data.map((item, index) => (
              <AccordionItem
                key={item.id}
                aria-label={item.inviteUrl}
                title={
                  <div className="line-clamp-1 flex items-center gap-2">
                    {index + 1}.<p className="line-clamp-1">{item.inviteUrl}</p>
                  </div>
                }
              >
                <CopierButton
                  content={item.inviteUrl}
                  aria-label="Copy invitation link"
                  className="flex items-center gap-2 mb-4 text-primary-500"
                >
                  <Copy className="w-4" /> Copy invitation link
                </CopierButton>
                <InviteLinkItem link={item} roomId={roomId} />
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Button
            className="w-full"
            onPress={() => execute(roomId)}
            isDisabled={isGenerating || isLoading}
            isLoading={isGenerating}
            size="sm"
            color="primary"
          >
            Create Invite Link <Link className="w-4" />
          </Button>
        )}
      </div>
      <PanelPagination
        page={page}
        totalPages={totalPages}
        onChange={setPage}
        disabled={isPlaceholderData}
      />
    </div>
  );
}
