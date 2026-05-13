import Link from "next/link";
import { GalleryClient } from "@/components/GalleryClient";
import { getYouTubeVideos } from "@/lib/data/youtube";

export const metadata = { title: "Gallery" };
export const revalidate = 3600;

const IMAGES = [
  { file: "project1.jpg", title: "Corporate Office Installation", location: "Bangalore" },
  { file: "project2.jpg", title: "Hospital Access Control", location: "Chennai" },
  { file: "project3.jpg", title: "Factory Turnstile Setup", location: "Mumbai" },
  { file: "project4.jpg", title: "Hotel Lock Implementation", location: "Delhi" },
  { file: "project5.jpg", title: "Government Building Security", location: "Hyderabad" },
  { file: "project6.jpg", title: "School Biometric System", location: "Pune" },
  { file: "project7.jpg", title: "Mall Security Installation", location: "Kolkata" },
  { file: "project8.jpg", title: "Apartment Complex Access", location: "Bangalore" },
  { file: "project9.jpg", title: "IT Park Security Solution", location: "Noida" },
];

export default async function GalleryPage() {
  const videosFromYouTube = await getYouTubeVideos();
  // Fallback to placeholders if the feed is unreachable, so the page never looks empty.
  const videos = videosFromYouTube.length > 0
    ? videosFromYouTube
    : [
        { id: "video1", title: "Biometric Access Control Demo", thumbnail: "https://via.placeholder.com/400x225/1a365d/ffffff?text=Video+1" },
        { id: "video2", title: "Turnstile Installation Guide",  thumbnail: "https://via.placeholder.com/400x225/2d3748/ffffff?text=Video+2" },
      ];

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
          <GalleryClient videos={videos} images={IMAGES} />
        </div>
      </section>
    </>
  );
}
