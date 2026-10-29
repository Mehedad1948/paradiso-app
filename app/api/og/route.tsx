import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_SOURCE_BYTES = 6 * 1024 * 1024;

// Subset of Great Vibes holding only the glyphs of the wordmark (~15KB).
let greatVibesFont: Promise<Buffer> | undefined;
const greatVibes = () =>
  (greatVibesFont ??= readFile(
    join(process.cwd(), "assets/fonts/GreatVibes-Subset.ttf"),
  ));

/** Only TMDB artwork may be composited, so this can't be used as an open proxy. */
const allowedHosts = new Set(
  [
    "image.tmdb.org",
    process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL
      ? new URL(process.env.NEXT_PUBLIC_BASE_TMDB_IMAGE_URL).hostname
      : null,
  ].filter((host): host is string => !!host),
);

async function loadSource(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png|webp)/.test(type)) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_SOURCE_BYTES) return null;
    // Satori can't decode WebP; TMDB serves JPEG, so anything else falls back.
    if (!/jpeg|png/.test(type)) return null;
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const [source, font] = await Promise.all([
    loadSource(searchParams.get("src")),
    greatVibes(),
  ]);
  // A portrait would lose the face if cropped to the wide frame, so it sits
  // whole in front of a blurred, darkened copy of itself.
  const portrait = searchParams.get("fit") === "portrait";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #1b1022 0%, #07060a 100%)",
        }}
      >
        {source && (
          <img
            src={source}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: portrait ? "50% 25%" : "50% 50%",
              ...(portrait && { filter: "blur(36px) brightness(0.55)" }),
            }}
          />
        )}
        {source && portrait && (
          <img
            src={source}
            alt=""
            width={420}
            height={HEIGHT}
            style={{
              position: "absolute",
              top: 0,
              left: 390,
              width: 420,
              height: HEIGHT,
              objectFit: "cover",
              objectPosition: "50% 20%",
            }}
          />
        )}
        {/* Fade the bottom edge, then a soft pool of shadow behind the wordmark. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "linear-gradient(to top, rgba(6,4,10,0.88) 0%, rgba(6,4,10,0.55) 22%, rgba(6,4,10,0) 48%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background:
              "radial-gradient(ellipse 620px 260px at 0% 100%, rgba(6,4,10,0.7) 0%, rgba(6,4,10,0) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 56,
            bottom: 40,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Great Vibes",
              fontSize: 96,
              lineHeight: 1,
              color: "#ffffff",
              textShadow: "0 2px 24px rgba(0,0,0,0.65)",
            }}
          >
            <span style={{ marginRight: 26 }}>Cinema</span>
            <span>Paradiso</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              marginLeft: 4,
              width: 220,
              height: 2,
              background:
                "linear-gradient(to right, rgba(255,255,255,0.85), rgba(255,255,255,0))",
            }}
          />
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: "Great Vibes", data: font, style: "normal", weight: 400 }],
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
