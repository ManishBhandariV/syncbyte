"use client";

import { useState } from "react";

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

  return (
    <div className="product-detail-image">
      <div className="main-image">
        <img id="mainProductImage" src={thumbs[active]} alt={productName} />
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
    </div>
  );
}
