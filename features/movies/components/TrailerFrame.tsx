"use client";
import { motion } from "framer-motion";

/** The trailer, privacy-enhanced and playing inline where the backdrop was. */
export default function TrailerFrame({ videoKey, title }: { videoKey: string; title: string }) {
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1" });
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="absolute inset-0 bg-black"
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?${params}`}
        title={`${title} trailer`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    </motion.div>
  );
}
