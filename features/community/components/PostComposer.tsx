"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/toast";
import { Globe2, ImagePlus, Lock, Megaphone, RefreshCw, X } from "lucide-react";
import {
  useCreatePost,
  useUpdatePost,
  useUploadPostImage,
} from "@/hooks/queries/useCommunityQueries";
import { panelKeys } from "@/lib/query/panel-keys";
import { promotionToken } from "@/lib/community/promotion";
import { postTextError, ratingError } from "@/lib/community/validation";
import { COMMUNITY_LIMITS, type CommunityPost, type ResolvedMovie } from "@/types/community";
import { useViewer } from "../hooks/useViewer";
import { hasCustomImage } from "../format";
import SlideCommit from "@/components/ui/SlideCommit";
import FilmPicker from "./FilmPicker";
import RatingInput from "./RatingInput";

const MAX_IMAGE = 5 * 1024 * 1024;

function Pill({
  selected,
  onSelect,
  disabled,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={clsx(
        "inline-flex min-h-[36px] max-w-[220px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:opacity-50",
        selected ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-muted",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Create or edit a recommendation. Creating offers where to post and, for
 * room owners, a room to promote; editing can change only text, rating and image.
 */
export default function PostComposer({
  post,
  roomId: presetRoomId,
  onClose,
  onPosted,
}: {
  post?: CommunityPost;
  /** Post into this room; the audience can't be changed. */
  roomId?: number;
  onClose: () => void;
  onPosted?: (post: CommunityPost) => void;
}) {
  const editing = !!post;
  const viewer = useViewer();
  const client = useQueryClient();
  const create = useCreatePost();
  const update = useUpdatePost();
  const upload = useUploadPostImage();

  const [movie, setMovie] = useState<ResolvedMovie | null>(
    post ? { ...post.movie } : null,
  );
  const [rating, setRating] = useState(post?.rating ?? 7);
  const [text, setText] = useState(post?.text ?? "");
  const [image, setImage] = useState<{ url: string; preview: string } | null>(
    post && hasCustomImage(post) ? { url: post.imageUrl!, preview: post.imageUrl! } : null,
  );
  const [roomId, setRoomId] = useState<number | null>(presetRoomId ?? null);
  const [promote, setPromote] = useState(false);
  const [promotedRoom, setPromotedRoom] = useState<number | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [touched, setTouched] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);

  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);
  // Default the promoted room once the viewer's rooms arrive.
  useEffect(() => {
    if (promotedRoom === null && viewer.ownedRooms.length)
      setPromotedRoom(
        viewer.ownedRooms.find((room) => room.id === presetRoomId)?.id ?? viewer.ownedRooms[0].id,
      );
  }, [viewer.ownedRooms, promotedRoom, presetRoomId]);

  const busy = create.isPending || update.isPending || promoting;
  const textError = postTextError(text);
  const length = text.trim().length;
  const valid = !!movie && !textError && !ratingError(rating) && !upload.isPending;
  const presetRoom = viewer.rooms.find((room) => room.id === presetRoomId);

  function chooseImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE) {
      addToast({ title: "Choose an image up to 5 MB", color: "danger" });
      return;
    }
    const preview = URL.createObjectURL(file);
    previews.current.push(preview);
    const previous = image;
    setImage({ url: "", preview });
    upload.mutate(file, {
      onSuccess: ({ url }) => setImage({ url, preview }),
      onError: () => setImage(previous),
    });
  }

  /** Resolves once saved, rejects if invalid or the request fails. Closing is up to the caller. */
  async function submit() {
    setTouched(true);
    if (!valid) throw new Error("invalid");
    if (busy) throw new Error("busy");
    if (post) {
      const changes = {
        ...(text.trim() !== post.text ? { text: text.trim() } : {}),
        ...(rating !== post.rating ? { rating } : {}),
        ...(image?.url && image.url !== post.imageUrl ? { imageUrl: image.url } : {}),
      };
      if (!Object.keys(changes).length) return;
      await update.mutateAsync({ id: post.id, ...changes });
      addToast({ title: "Recommendation updated", color: "success" });
      return;
    }
    let promotedInviteToken: string | undefined;
    if (promote && promotedRoom) {
      setPromoting(true);
      try {
        const link = await promotionToken(promotedRoom);
        promotedInviteToken = link.token;
        if (link.created)
          void client.invalidateQueries({ queryKey: panelKeys.links(String(promotedRoom)) });
      } catch (error) {
        addToast({
          title: error instanceof Error ? error.message : "Couldn't prepare an invite link",
          color: "danger",
        });
        throw error;
      } finally {
        setPromoting(false);
      }
    }
    const created = await create.mutateAsync({
      movieId: movie!.id,
      text: text.trim(),
      rating,
      ...(image?.url ? { imageUrl: image.url } : {}),
      ...(roomId ? { roomId } : {}),
      ...(promotedInviteToken ? { promotedInviteToken } : {}),
    });
    addToast({ title: "Recommendation posted", color: "success" });
    onPosted?.(created);
  }

  return (
    <Modal
      isOpen
      size="2xl"
      placement="center"
      scrollBehavior="inside"
      onClose={onClose}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
      hideCloseButton={busy}
      classNames={{ wrapper: "max-sm:items-end", base: "max-sm:m-0 max-sm:rounded-b-none" }}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)]">
        <ModalHeader className="flex flex-col gap-1 pb-2 pt-6">
          <span className="text-sm font-semibold uppercase tracking-[0.09em] text-accent">
            {editing ? "Edit" : presetRoom ? `Post in ${presetRoom.name}` : "New recommendation"}
          </span>
          <span className="text-2xl font-semibold tracking-[-0.04em]">
            {editing ? "Refine your take" : "What should we watch?"}
          </span>
        </ModalHeader>
        <ModalBody
          className="gap-5 py-4 text-base"
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit().then(onClose, () => {});
          }}
        >
          <FilmPicker
            roomId={presetRoomId}
            viewer={viewer}
            value={movie}
            onChange={setMovie}
            locked={editing}
            disabled={busy}
          />
          {touched && !movie && <p className="-mt-3 text-sm text-danger">Pick the film you&apos;re recommending.</p>}

          <RatingInput value={rating} onChange={setRating} disabled={busy} />

          <div>
            <Textarea
              aria-label="Why should we watch it?"
              placeholder="Why should we watch it? No spoilers, or warn us first."
              value={text}
              onValueChange={setText}
              minRows={4}
              maxRows={14}
              isDisabled={busy}
              isInvalid={touched && !!textError}
              errorMessage={touched ? textError : undefined}
              classNames={{ inputWrapper: "border border-line bg-surface shadow-none", input: "text-base leading-[1.6]" }}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    chooseImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {!image && (
                  <Button
                    size="sm"
                    variant="light"
                    isDisabled={busy}
                    startContent={<ImagePlus size={17} />}
                    onPress={() => fileInput.current?.click()}
                    className="font-semibold text-accent"
                  >
                    Add a still
                  </Button>
                )}
              </div>
              <span
                className={clsx(
                  "text-sm tabular-nums",
                  length > COMMUNITY_LIMITS.text ? "font-semibold text-danger" : length > COMMUNITY_LIMITS.text * 0.9 ? "text-warning" : "text-muted",
                )}
              >
                {length.toLocaleString()} / {COMMUNITY_LIMITS.text.toLocaleString()}
              </span>
            </div>
            {image && (
              <div className="relative mt-2 overflow-hidden rounded-[10px] border border-line bg-media">
                <img src={image.preview} alt="Attached still" className="aspect-[16/9] w-full object-cover" />
                {upload.isPending && (
                  <span className="absolute inset-0 flex items-center justify-center bg-media/60">
                    <Spinner color="white" label="Uploading" classNames={{ label: "text-media-foreground" }} />
                  </span>
                )}
                <div className="absolute right-2 top-2 flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    radius="full"
                    aria-label="Replace image"
                    isDisabled={busy || upload.isPending}
                    onPress={() => fileInput.current?.click()}
                    className="bg-media/80 text-media-foreground backdrop-blur"
                  >
                    <RefreshCw size={15} />
                  </Button>
                  {/* The backend can't clear a saved image, so only a new upload can be removed. */}
                  {(!editing || image.url !== post?.imageUrl) && (
                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      aria-label="Remove image"
                      isDisabled={busy || upload.isPending}
                      onPress={() =>
                        setImage(post && hasCustomImage(post) ? { url: post.imageUrl!, preview: post.imageUrl! } : null)
                      }
                      className="bg-media/80 text-media-foreground backdrop-blur"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </div>
            )}
            {!image && <p className="mt-1 text-sm text-muted">Without a still, the film&apos;s poster is shown.</p>}
          </div>

          {!editing && !presetRoomId && viewer.rooms.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Who can see it</legend>
              <div role="radiogroup" aria-label="Who can see it" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <Pill selected={roomId === null} onSelect={() => setRoomId(null)} disabled={busy}>
                  <Globe2 size={15} aria-hidden="true" /> Everyone
                </Pill>
                {viewer.rooms.map((room) => (
                  <Pill key={room.id} selected={roomId === room.id} onSelect={() => setRoomId(room.id)} disabled={busy}>
                    {room.isPublic ? <Globe2 size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
                    <span className="truncate">{room.name}</span>
                  </Pill>
                ))}
              </div>
              <p className="mt-1.5 text-sm text-muted">
                {roomId === null
                  ? "Shown in the community feed and on your profile."
                  : viewer.rooms.find((room) => room.id === roomId)?.isPublic
                    ? "Posted in the room's discussion. Public rooms also reach the community feed."
                    : "Only members of this private room will see it."}
              </p>
            </fieldset>
          )}

          {!editing && viewer.ownedRooms.length > 0 && (
            <div className="rounded-[10px] border border-line bg-surface/60 p-4">
              <Switch size="sm" isSelected={promote} onValueChange={setPromote} isDisabled={busy}>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                  <Megaphone size={16} aria-hidden="true" /> Promote one of your rooms
                </span>
              </Switch>
              {promote && (
                <div className="mt-3">
                  <div role="radiogroup" aria-label="Room to promote" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {viewer.ownedRooms.map((room) => (
                      <Pill key={room.id} selected={promotedRoom === room.id} onSelect={() => setPromotedRoom(room.id)} disabled={busy}>
                        <span className="truncate">{room.name}</span>
                      </Pill>
                    ))}
                  </div>
                  <p className="mt-1.5 text-sm text-muted">
                    Readers see the room&apos;s name and image, with a button to join through an invite link.
                  </p>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t border-line">
          <span className="mr-auto hidden self-center text-sm text-muted sm:inline">Ctrl + Enter to post</span>
          <Button variant="light" isDisabled={busy} onPress={onClose}>
            Cancel
          </Button>
          <SlideCommit
            label={editing ? "Slide to save" : "Slide to post"}
            doneLabel={editing ? "Saved" : "Posted"}
            errorLabel="Couldn't post"
            width={220}
            height={44}
            radius={22}
            trackColor="#18181b"
            handleColor="#f5f5f5"
            disabled={upload.isPending}
            onConfirm={submit}
            onDone={onClose}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
