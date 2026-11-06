/** Downscaling for uploaded avatars.
 *
 *  An avatar lives in `suite-prefs`, which is one jsonb row shared with the
 *  whole suite — SUITE-ARCHITECTURE's size guard says keep a row well under a
 *  megabyte. A phone photo pasted in raw is several. So nothing reaches storage
 *  before it has been cropped square, resized to `SIZE`, and re-encoded; the
 *  result is a few kilobytes regardless of what went in. */

const SIZE = 128;
const QUALITY = 0.86;
/** Refuse absurd inputs outright rather than decoding them first. */
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

export type ImageError = "too-large" | "unsupported" | "failed";

export async function toAvatarDataUrl(file: File): Promise<{ dataUrl: string } | { error: ImageError }> {
  if (!file.type.startsWith("image/")) return { error: "unsupported" };
  if (file.size > MAX_SOURCE_BYTES) return { error: "too-large" };

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "failed" };

    // Centre-crop to a square first, so a wide photo is not squashed into the
    // circle it will be masked into.
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, sx, sy, side, side, 0, 0, SIZE, SIZE);

    // JPEG rather than PNG: photographs are the common case, and a 128px PNG of
    // one is several times larger for no visible gain. Transparency would be
    // lost, but the avatar is masked into a circle anyway.
    return { dataUrl: canvas.toDataURL("image/jpeg", QUALITY) };
  } catch {
    return { error: "failed" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode failed"));
    image.src = src;
  });
}
