"use client";

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
        <img
          id="mainProductImage"
          src={thumbs[active]}
          alt={productName}
          onClick={() => setLightboxOpen(true)}
        />
      </div>
      {thumbs.length > 1 && (
        <div className="image-thumbnails">
          {thumbs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${productName} ${i + 1}`}
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
          <img
            src={thumbs[active]}
            alt={productName}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
