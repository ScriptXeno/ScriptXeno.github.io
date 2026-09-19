import sharp from "sharp";

export async function toPngBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input).png().toBuffer();
}

export async function toWebpBuffer(input: Buffer, quality = 82): Promise<Buffer> {
  return sharp(input).webp({ quality }).toBuffer();
}

/** Resized thumbnail for small display contexts (homepage/related-post cards, ~400px
 * wide) so those don't have to download the full-size feature image. */
export async function toResizedWebpBuffer(input: Buffer, width: number, quality = 82): Promise<Buffer> {
  return sharp(input).resize({ width }).webp({ quality }).toBuffer();
}

/** Small blurred placeholder file kept alongside images in some repos for parity —
 * not referenced by post front matter, which always uses the static STATIC_LQIP string. */
export async function toTinyPlaceholderBuffer(input: Buffer): Promise<Buffer> {
  return sharp(input).resize({ width: 16 }).blur().webp({ quality: 20 }).toBuffer();
}
