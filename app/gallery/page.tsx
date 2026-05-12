import Link from "next/link";
import { GalleryClient } from "@/components/GalleryClient";

export const metadata = { title: "Gallery" };

const VIDEOS = [
  { id: "video1", title: "Biometric Access Control Demo", thumbnail: "https://via.placeholder.com/400x225/1a365d/ffffff?text=Video+1" },
  { id: "video2", title: "Turnstile Installation Guide", thumbnail: "https://via.placeholder.com/400x225/2d3748/ffffff?text=Video+2" },
  { id: "video3", title: "Face Recognition System Overview", thumbnail: "https://via.placeholder.com/400x225/4a5568/ffffff?text=Video+3" },
  { id: "video4", title: "Boom Barrier Features", thumbnail: "https://via.placeholder.com/400x225/553c9a/ffffff?text=Video+4" },
  { id: "video5", title: "Hotel Lock System Demo", thumbnail: "https://via.placeholder.com/400x225/1a365d/ffffff?text=Video+5" },
  { id: "video6", title: "Software Solutions Walkthrough", thumbnail: "https://via.placeholder.com/400x225/2d3748/ffffff?text=Video+6" },
];

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

export default function GalleryPage() {
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
          <GalleryClient videos={VIDEOS} images={IMAGES} />
        </div>
      </section>
    </>
  );
}
