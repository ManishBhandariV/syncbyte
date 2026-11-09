"use client";

import Image from "next/image";

import { useCallback, useEffect, useState } from "react";

type Props = {
  /** Ordered image URLs (1-3). First is the primary. */
  images: string[];
  productName: string;
};

export function ProductImageGallery({ images, productName }: Props) {
  const thumbs = images.length > 0 ? images : ["/images/placeholder.png"];
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, closeLightbox]);

  return (
    <div className="product-detail-image">
      <div className="main-image">
        <Image
          id="mainProductImage"
          src={thumbs[active]}
          alt={productName}
          width={800}
          height={600}
          preload
          sizes="(max-width: 768px) 100vw, 600px"
          style={{ width: "100%", height: 300, objectFit: "contain" }}
          onClick={() => setLightboxOpen(true)}
        />
      </div>
      {thumbs.length > 1 && (
        <div className="image-thumbnails">
          {thumbs.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`${productName} ${i + 1}`}
              width={80}
              height={60}
              className={`thumbnail ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} enlarged image`}
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="product-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
          <Image
            src={thumbs[active]}
            alt={productName}
            width={1400}
            height={1050}
            sizes="92vw"
            style={{ width: "auto", height: "auto", maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
