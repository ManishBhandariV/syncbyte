/**
 * Pulls the latest videos from the Syncbyte YouTube channel via the public
 * Atom/RSS feed — no API key needed. Cached for 1 hour by Next.js.
 *
 * If the fetch fails (channel offline, network), returns an empty array so
 * the gallery falls back gracefully to its placeholder state.
 */

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  published: string;
};

// Resolved from `@syncbyte9550` — kept here so we don't refetch the handle
// page on every render. Override via YOUTUBE_CHANNEL_ID env if it changes.
const DEFAULT_CHANNEL_ID = "UC-NFpUE4sF9MkLcLKIqbvCA";

export async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID ?? DEFAULT_CHANNEL_ID;
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.warn("[youtube] RSS fetch returned", res.status);
      return [];
    }
    const xml = await res.text();
    return parseFeed(xml);
  } catch (e) {
    console.warn("[youtube] fetch failed", e);
    return [];
  }
}

function parseFeed(xml: string): YouTubeVideo[] {
  const entries: YouTubeVideo[] = [];
  // Each <entry> block is one video.
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const id = pluck(block, /<yt:videoId>([^<]+)<\/yt:videoId>/);
    const title = pluck(block, /<title>([^<]+)<\/title>/);
    const published = pluck(block, /<published>([^<]+)<\/published>/);
    const thumb = pluck(block, /<media:thumbnail\s+url="([^"]+)"/);
    if (!id || !title) continue;
    entries.push({
      id,
      title: decodeEntities(title),
      thumbnail: thumb || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
      published: published ?? "",
    });
  }
  return entries;
}

function pluck(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}
