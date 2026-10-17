"use client";
import { createContext, useContext } from "react";
import type { User } from "@/types/user";
import type { ChatMessage, PublicUser } from "@/types/chat";
import type { PanelRoom } from "@/lib/api/panel";
import type { ChatActions } from "./hooks/useChatActions";

export type RoomMovie = PanelRoom["movies"][number];

export type ChatContextValue = {
  roomId: string;
  me: User;
  ownerId: number;
  isOwner: boolean;
  /** Room users plus the owner; resolves userIds, voterIds and pinnedById. */
  members: Map<number, PublicUser>;
  roomMovies: Map<string, RoomMovie>;
  actions: ChatActions;
  reply: (message: ChatMessage) => void;
  edit: (message: ChatMessage) => void;
  requestDelete: (message: ChatMessage) => void;
  jumpTo: (id: number) => void;
  showInWatchlist: (title: string) => void;
};

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside RoomChat");
  return value;
}

export function memberName(members: Map<number, PublicUser>, id: number | null | undefined) {
  return (id !== null && id !== undefined && members.get(id)?.username) || "Someone";
}
