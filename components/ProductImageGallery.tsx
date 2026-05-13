"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  mainImage: string;
  productId: string;
  productName: string;
};

export function ProductImageGallery({ mainImage, productId, productName }: Props) {
  const thumb2 = `/images/products/${encodeURIComponent(productId)}-2.jpg`;
  const thumb3 = `/images/products/${encodeURIComponent(productId)}-3.jpg`;
  const thumbs = [mainImage, thumb2, thumb3];

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
      <div className="image-thumbnails">
        {thumbs.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${productName} ${i + 1}`}
            className={`thumbnail ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/100x100/e2e8f0/1a365d?text=${i + 1}`;
            }}
          />
        ))}
      </div>

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
