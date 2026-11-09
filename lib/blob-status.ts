/**
 * Kill-switch for Vercel Blob-hosted assets.
 *
 * When the Blob store exceeds its included data transfer the whole store is
 * blocked and every public URL returns `403 Your store is blocked`. The DB
 * still holds those URLs, so pages render broken images and dead download
 * links even though the rest of the site is healthy.
 *
 * Setting `BLOB_BLOCKED=1` makes the server-side resolvers ignore Blob URLs
 * entirely, so each asset falls through to the bundled `/public` fallback that
 * every resolver already has. Remove the variable once the store is live.
 *
 * Server-only by design: the resolvers that consume this all run in Server
 * Components, and `BLOB_BLOCKED` is deliberately not `NEXT_PUBLIC_` so the
 * value never has to be in sync with a client bundle.
 */
export const BLOB_BLOCKED = process.env.BLOB_BLOCKED === "1";

const BLOB_HOST = /^https?:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i;

/** True when the URL points at a Vercel Blob store. */
export function isBlobUrl(url: string | null | undefined): boolean {
  return !!url && BLOB_HOST.test(url);
}

/** The URL, unless it points at a Blob store we know is blocked. */
export function usableAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return BLOB_BLOCKED && isBlobUrl(url) ? null : url;
}

/** Drops rows whose asset URL lives in a blocked Blob store. */
export function withoutBlockedBlobs<T>(
  rows: T[],
  pick: (row: T) => string | null | undefined,
): T[] {
  if (!BLOB_BLOCKED) return rows;
  return rows.filter((row) => !isBlobUrl(pick(row)));
}
