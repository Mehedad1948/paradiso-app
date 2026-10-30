import { addToast } from "@/components/ui/toast";
import { LinkRoundIcon, ShareIcon } from "@solar-icons/react/linear";
import type { BubbleItem } from "./BubbleMenu";
import { FacebookLogo, TelegramLogo, XLogo } from "./BrandIcons";

function copyLink(url: string) {
  navigator.clipboard
    .writeText(url)
    .then(() => addToast({ title: "Link copied", color: "success" }))
    .catch(() => addToast({ title: "Couldn't copy the link", color: "danger" }));
}

/** The fan of share bubbles a post's action bar opens: copy, X, Facebook, Telegram. Browser only. */
export function shareItems({ url, text }: { url: string; text: string }): BubbleItem[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const items: BubbleItem[] = [
    { key: "copy", label: "Copy link", icon: <LinkRoundIcon size={18} />, onSelect: () => copyLink(url), className: "hover:text-emerald-500" },
    { key: "x", label: "Share on X", icon: <XLogo />, href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: "facebook", label: "Share on Facebook", icon: <FacebookLogo />, href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, className: "hover:text-[#1877f2]" },
    { key: "telegram", label: "Share on Telegram", icon: <TelegramLogo />, href: `https://t.me/share/url?url=${u}&text=${t}`, className: "hover:text-[#229ed9]" },
  ];
  // Desktop share sheets are thin; on phones the native one reaches every app.
  if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
    items.push({
      key: "more",
      label: "More options",
      icon: <ShareIcon size={18} />,
      onSelect: () => navigator.share({ title: text, url }).catch(() => {}),
    });
  }
  return items;
}
