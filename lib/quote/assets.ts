import "server-only";
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

export type LoadedImage = {
  dataUri: string; // for @react-pdf/renderer <Image src>
  buffer: Buffer; // for docx ImageRun
  width: number;
  height: number;
  type: "png" | "jpg";
};

const PUBLIC = path.join(process.cwd(), "public");

function mimeFor(file: string): { mime: string; type: "png" | "jpg" } {
  return /\.(jpe?g)$/i.test(file)
    ? { mime: "image/jpeg", type: "jpg" }
    : { mime: "image/png", type: "png" };
}

/** Read an image under /public into a form usable by both PDF and Word. */
export function loadImage(relPathUnderPublic: string): LoadedImage | null {
  try {
    const abs = path.join(PUBLIC, relPathUnderPublic);
    const buffer = fs.readFileSync(abs);
    const { width = 0, height = 0 } = imageSize(buffer);
    const { mime, type } = mimeFor(relPathUnderPublic);
    return {
      buffer,
      dataUri: `data:${mime};base64,${buffer.toString("base64")}`,
      width,
      height,
      type,
    };
  } catch (e) {
    console.warn("[quote assets] failed to load", relPathUnderPublic, e);
    return null;
  }
}

/** The centered Syncbyte logo shown on every page. */
export function loadHeaderLogo(): LoadedImage | null {
  return loadImage("images/quote/syncbyte-logo.png");
}

/**
 * Customer logos for the "Our Esteemed Customers" wall — the exact logos
 * extracted from the original SB_Quote_Top.docx, kept in document order
 * (filenames c01, c02, …). Shows all by default.
 */
export function loadCustomerLogos(limit = 100): LoadedImage[] {
  try {
    const dir = path.join(PUBLIC, "images", "quote", "customers");
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(png|jpe?g)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .slice(0, limit);
    return files
      .map((f) => loadImage(path.posix.join("images/quote/customers", f)))
      .filter((x): x is LoadedImage => x !== null);
  } catch (e) {
    console.warn("[quote assets] failed to list customer logos", e);
    return [];
  }
}

/** Scale an image to a target height, returning integer {width,height}. */
export function scaleToHeight(img: LoadedImage, targetH: number): { width: number; height: number } {
  const ratio = img.width > 0 ? img.height / img.width : 0.33;
  return { width: Math.round(targetH / ratio), height: targetH };
}

/** Scale an image to fit within a box, preserving aspect ratio. */
export function fitBox(
  img: LoadedImage,
  boxW: number,
  boxH: number,
): { width: number; height: number } {
  if (img.width <= 0 || img.height <= 0) return { width: boxW, height: boxH };
  const scale = Math.min(boxW / img.width, boxH / img.height);
  return {
    width: Math.max(1, Math.round(img.width * scale)),
    height: Math.max(1, Math.round(img.height * scale)),
  };
}
