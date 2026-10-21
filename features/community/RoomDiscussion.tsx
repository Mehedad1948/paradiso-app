"use client";
import Sidebar from "@/components/ui/Sidebar";
import { useViewer } from "./hooks/useViewer";
import FeedList from "./components/FeedList";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

const PostComposer = dynamic(() => import("./components/PostComposer"), { ssr: false });

/** A room's own recommendations, with the composer scoped to the room. */
export default function RoomDiscussion({
  room,
  canPost,
  onClose,
}: {
  room: { id: number; name: string };
  canPost: boolean;
  onClose: () => void;
}) {
  const viewer = useViewer();
  const [composing, setComposing] = useState(false);
  return (
    <Sidebar
      title="Discussion"
      description={`Recommendations shared in ${room.name}.`}
      size="xl"
      onClose={onClose}
    >
      <div className="-mx-6 -my-6">
        {canPost && viewer.me && (
          <div className="flex justify-end border-b border-line px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent transition-opacity hover:opacity-90"
            >
              <Plus size={18} aria-hidden="true" />
              Recommend a film
            </button>
          </div>
        )}
        {composing && <PostComposer roomId={room.id} onClose={() => setComposing(false)} />}
        <FeedList
          bare
          scope={{ kind: "room", roomId: room.id }}
          viewer={viewer}
          empty={
            <div className="mx-auto max-w-[340px]">
              <p className="text-lg font-semibold">No recommendations yet</p>
              <p className="mt-1 text-[15px] text-muted">
                {canPost ? "Start the conversation with a film the room should see." : "Join the room to start the conversation."}
              </p>
            </div>
          }
        />
      </div>
    </Sidebar>
  );
}
