import Link from "next/link";
import { GalleryClient } from "@/components/GalleryClient";
import { getYouTubeVideos } from "@/lib/data/youtube";
import { loadGalleryImages, loadGalleryVideos } from "@/lib/data/gallery-server";
import { svgPlaceholder } from "@/lib/placeholder";

export const metadata = { title: "Gallery" };
export const revalidate = 3600;

// Static fallback shown only if there are no DB rows and no project images uploaded.
const FALLBACK_IMAGES = [
  { file: "project1.jpg", title: "Corporate Office Installation", location: "Bangalore" },
  { file: "project2.jpg", title: "Hospital Access Control",       location: "Chennai" },
  { file: "project3.jpg", title: "Factory Turnstile Setup",       location: "Mumbai" },
];

export default async function GalleryPage() {
  // Videos: admin-curated rows first, then any extras from the YouTube channel RSS.
  const [pinnedVideos, rssVideos] = await Promise.all([
    loadGalleryVideos(),
    getYouTubeVideos(),
  ]);
  const pinnedIds = new Set(pinnedVideos.map((v) => v.youtube_id));
  const pinnedAsCards = pinnedVideos.map((v) => ({
    id: v.youtube_id,
    title: v.title,
    thumbnail: `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${v.youtube_id}`,
  }));
  const rssDeduped = rssVideos.filter((v) => !pinnedIds.has(v.id));
  const allVideos =
    pinnedAsCards.length + rssDeduped.length > 0
      ? [...pinnedAsCards, ...rssDeduped]
      : [
          { id: "video1", title: "Biometric Access Control Demo", thumbnail: svgPlaceholder("Video", { width: 400, height: 225, bg: "#1a365d", fg: "#ffffff" }) },
        ];

  // Images: admin-uploaded first; fall back to bundled project placeholders.
  const dbImages = await loadGalleryImages();
  const images =
    dbImages.length > 0
      ? dbImages.map((g) => ({
          file: g.image_url, // already an absolute Blob URL
          title: g.title,
          location: g.location ?? "",
        }))
      : FALLBACK_IMAGES;

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">Gallery</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Gallery</span>
          </nav>
        </div>
      </section>

      <section className="section gallery-section">
        <div className="container">
          <GalleryClient videos={allVideos} images={images} />
        </div>
      </section>
    </>
  );
}
