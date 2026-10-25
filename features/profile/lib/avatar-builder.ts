import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

type Schema = { properties: Record<string, { items?: { enum?: string[] } }> };
const properties = (notionists.schema as unknown as Schema).properties;
const variants = (key: string) => [...(properties[key]?.items?.enum ?? [])].sort();

/** A part the user can swap. `optional` parts also offer "none". */
export const PARTS = [
  { key: "hair", label: "Hair", options: variants("hair"), optional: false },
  { key: "brows", label: "Brows", options: variants("brows"), optional: false },
  { key: "eyes", label: "Eyes", options: variants("eyes"), optional: false },
  { key: "nose", label: "Nose", options: variants("nose"), optional: false },
  { key: "lips", label: "Lips", options: variants("lips"), optional: false },
  { key: "beard", label: "Beard", options: variants("beard"), optional: true },
  { key: "glasses", label: "Glasses", options: variants("glasses"), optional: true },
  { key: "body", label: "Outfit", options: variants("body"), optional: false },
  { key: "gesture", label: "Gesture", options: variants("gesture"), optional: true },
] as const;

export type PartKey = (typeof PARTS)[number]["key"];
export type AvatarConfig = Record<PartKey, string | null> & { background: string };

export const BACKGROUNDS = [
  "e8e3ff",
  "d6f0ff",
  "d4f5e4",
  "fff1c9",
  "ffdcd2",
  "fbd5ea",
  "e4e4e7",
  "2b2d42",
  "5b4bdb",
  "0f766e",
];

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** Where everyone starts: wide-open eyes, a warm smile and a sharp jacket. */
export const DEFAULT_CONFIG: AvatarConfig = {
  hair: "variant20",
  brows: "variant04",
  eyes: "variant05",
  nose: "variant05",
  lips: "variant03",
  beard: null,
  glasses: null,
  body: "variant06",
  gesture: null,
  background: "d6f0ff",
};

export function randomConfig(): AvatarConfig {
  const config = { background: pick(BACKGROUNDS) } as AvatarConfig;
  for (const part of PARTS) {
    // Optional parts appear about a third of the time, so a shuffle doesn't look cluttered.
    config[part.key] = part.optional && Math.random() > 0.35 ? null : pick(part.options);
  }
  return config;
}

function build(config: AvatarConfig, size?: number) {
  const on = (key: PartKey) => (config[key] ? 100 : 0);
  return createAvatar(notionists, {
    size,
    // The style's own randomness is switched off: every part is chosen explicitly.
    seed: "paradiso",
    backgroundType: ["solid"],
    backgroundColor: [config.background],
    hair: config.hair ? [config.hair as never] : undefined,
    brows: [config.brows as never],
    eyes: [config.eyes as never],
    nose: [config.nose as never],
    lips: [config.lips as never],
    body: [config.body as never],
    beard: config.beard ? [config.beard as never] : undefined,
    beardProbability: on("beard"),
    glasses: config.glasses ? [config.glasses as never] : undefined,
    glassesProbability: on("glasses"),
    gesture: config.gesture ? [config.gesture as never] : undefined,
    gestureProbability: on("gesture"),
    bodyIconProbability: 0,
  });
}

export const avatarDataUri = (config: AvatarConfig, size?: number) => build(config, size).toDataUri();

/** Rasterises the avatar to a 512×512 PNG, the same shape of file a photo upload produces. */
export async function renderAvatarConfig(config: AvatarConfig, size = 512): Promise<File> {
  const image = new Image();
  image.src = avatarDataUri(config, size);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")?.drawImage(image, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The avatar could not be saved.");
  return new File([blob], "avatar.png", { type: "image/png" });
}
