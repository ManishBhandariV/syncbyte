"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/config";
import { svgPlaceholder } from "@/lib/placeholder";

type Video = { id: string; title: string; thumbnail: string; url?: string };
type ProjectImage = { file: string; title: string; location: string };

type Filter = "all" | "videos" | "images";

export function GalleryClient({
  videos,
  images,
}: {
  videos: Video[];
  images: ProjectImage[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showVideos = filter !== "images";
  const showImages = filter !== "videos";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const current = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <>
      <div className="gallery-tabs">
        {(["all", "videos", "images"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`gallery-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "videos" ? "Videos" : "Project Images"}
          </button>
        ))}
      </div>

      <div
        className="gallery-content"
        id="videosSection"
        style={{ display: showVideos ? "block" : "none" }}
      >
        <div className="section-header">
          <h2 className="section-title">Our Videos</h2>
          <p className="section-subtitle">
            Watch our product demos and installation guides on YouTube
          </p>
        </div>
        <div className="videos-grid gallery-item videos">
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.url ?? siteConfig.social.youtube}
              target="_blank"
              rel="noopener"
              className="video-card"
            >
              <div className="video-thumbnail">
                <img src={v.thumbnail} alt={v.title} />
                <div className="play-overlay">
                  <i className="fab fa-youtube" />
                </div>
              </div>
              <div className="video-info">
                <h3 className="video-title">{v.title}</h3>
                <span className="video-channel">
                  <i className="fab fa-youtube" /> Watch on YouTube
                </span>
              </div>
            </a>
          ))}
        </div>
        <div className="section-cta">
          <a
            href={siteConfig.social.youtube}
            target="_blank"
            rel="noopener"
            className="btn btn-primary"
          >
            <i className="fab fa-youtube" /> Visit Our YouTube Channel
          </a>
        </div>
      </div>

      <div
        className="gallery-content"
        id="imagesSection"
        style={{ display: showImages ? "block" : "none" }}
      >
        <div className="section-header">
          <h2 className="section-title">Our Projects</h2>
          <p className="section-subtitle">
            See our successful installations across India
          </p>
        </div>
        <div className="images-grid gallery-item images">
          {images.map((img, i) => (
            <div className="image-card" key={img.file} onClick={() => setLightboxIndex(i)}>
              <div className="image-wrapper">
                <img
                  src={img.file.startsWith("http") || img.file.startsWith("/") ? img.file : `/images/gallery/${encodeURIComponent(img.file)}`}
                  alt={img.title}
                  onError={(e) => {
                    e.currentTarget.src = svgPlaceholder(img.title, { width: 400, height: 300 });
                  }}
                />
                <div className="image-overlay">
                  <i className="fas fa-search-plus" />
                </div>
              </div>
              <div className="image-info">
                <h3 className="image-title">{img.title}</h3>
                <span className="image-location">
                  <i className="fas fa-map-marker-alt" /> {img.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`lightbox ${current ? "active" : ""}`}
        id="lightbox"
        onClick={(e) => {
          if (e.target === e.currentTarget) setLightboxIndex(null);
        }}
      >
        <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
          <i className="fas fa-times" />
        </button>
        <button
          className="lightbox-nav prev"
          onClick={() =>
            setLightboxIndex((i) =>
              i === null ? 0 : (i - 1 + images.length) % images.length,
            )
          }
        >
          <i className="fas fa-chevron-left" />
        </button>
        <button
          className="lightbox-nav next"
          onClick={() =>
            setLightboxIndex((i) =>
              i === null ? 0 : (i + 1) % images.length,
            )
          }
        >
          <i className="fas fa-chevron-right" />
        </button>
        <div className="lightbox-content">
          {current && (
            <img
              src={
                current.file.startsWith("http") || current.file.startsWith("/")
                  ? current.file
                  : `/images/gallery/${encodeURIComponent(current.file)}`
              }
              alt={current.title}
              onError={(e) => {
                e.currentTarget.src = svgPlaceholder(current.title, { width: 800, height: 600 });
              }}
            />
          )}
          <div className="lightbox-caption">
            <h3>{current?.title}</h3>
            {current && (
              <p>
                <i className="fas fa-map-marker-alt" /> {current.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
