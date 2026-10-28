"use client";
import { motion } from "framer-motion";

/**
 * The trailer, playing inline where the backdrop was. Uses youtube.com rather than youtube-nocookie.com:
 * without the viewer's YouTube cookies the player often can't vouch for them and shows "confirm you're not a bot".
 */
export default function TrailerFrame({ videoKey, title }: { videoKey: string; title: string }) {
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1" });
  if (typeof window !== "undefined") params.set("origin", window.location.origin);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="absolute inset-0 bg-black"
    >
      <iframe
        src={`https://www.youtube.com/embed/${encodeURIComponent(videoKey)}?${params}`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    </motion.div>
  );
}
