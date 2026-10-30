"use client";
import { useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { addToast } from "@/components/ui/toast";
import { useCreatePost } from "@/hooks/queries/useCommunityQueries";
import { postTextError } from "@/lib/community/validation";
import { COMMUNITY_LIMITS, type CommunityPost } from "@/types/community";
import UserAvatar from "@/components/ui/UserAvatar";
import { ago, imageSrc } from "../format";

/** Your words above someone else's post, which is embedded as it is. */
export default function QuoteComposer({
  post,
  onClose,
}: {
  post: CommunityPost;
  onClose: () => void;
}) {
  const create = useCreatePost();
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const error = postTextError(text);
  const length = text.trim().length;
  const thumb = imageSrc(post.imageUrl ?? post.movie?.poster_path, "w185");

  function submit() {
    setTouched(true);
    if (error || create.isPending) return;
    create.mutate(
      { text: text.trim(), quotedPostId: post.id },
      {
        onSuccess: () => {
          addToast({ title: "Quote posted", color: "success" });
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      isOpen
      size="xl"
      placement="center"
      scrollBehavior="inside"
      onClose={onClose}
      isDismissable={!create.isPending}
      classNames={{ wrapper: "max-sm:items-end", base: "max-sm:m-0 max-sm:rounded-b-none" }}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)]">
        <ModalHeader className="flex flex-col gap-1 pb-2 pt-6">
          <span className="text-sm font-semibold uppercase tracking-[0.09em] text-accent">Quote</span>
          <span className="text-2xl font-semibold tracking-[-0.04em]">Add your take</span>
        </ModalHeader>
        <ModalBody
          className="gap-4 py-4"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
          }}
        >
          <Textarea
            autoFocus
            aria-label="Your take"
            placeholder="What do you make of it?"
            value={text}
            onValueChange={setText}
            minRows={3}
            maxRows={10}
            isDisabled={create.isPending}
            isInvalid={touched && !!error}
            errorMessage={touched ? error : undefined}
            classNames={{ inputWrapper: "border border-line bg-surface shadow-none", input: "text-base leading-[1.6]" }}
          />

          <figure className="flex gap-3 rounded-2xl border border-line p-3">
            <div className="min-w-0 flex-1">
              <figcaption className="flex items-center gap-2 text-sm">
                <UserAvatar name={post.author.username} src={post.author.avatar} size={22} />
                <span className="truncate font-semibold">{post.author.username}</span>
                <span className="shrink-0 text-muted">· {ago(post.createdAt)}</span>
              </figcaption>
              {post.movie && (
                <p className="mt-1.5 text-sm font-semibold text-accent">Recommends {post.movie.title}</p>
              )}
              {post.text && (
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-[15px] text-muted">
                  {post.text}
                </p>
              )}
            </div>
            {thumb && (
              <img
                src={thumb}
                alt=""
                aria-hidden="true"
                className="h-20 w-14 shrink-0 rounded-lg object-cover"
              />
            )}
          </figure>
        </ModalBody>
        <ModalFooter className="items-center border-t border-line">
          <span
            className={clsx(
              "mr-auto text-sm tabular-nums",
              length > COMMUNITY_LIMITS.text ? "font-semibold text-danger" : "text-muted",
            )}
          >
            {length.toLocaleString()} / {COMMUNITY_LIMITS.text.toLocaleString()}
          </span>
          <Button variant="light" isDisabled={create.isPending} onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            radius="full"
            isLoading={create.isPending}
            onPress={submit}
            className="font-semibold"
          >
            Post quote
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
