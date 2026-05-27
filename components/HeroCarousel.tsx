"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Slide = {
  src: string;
  fallbackText: string;
  alt: string;
  href: string;
  ctaLabel: string;
};

const DEFAULT_SLIDES: Slide[] = [
  { src: "/images/carousel/slide1.jpg", alt: "Fingerprint Devices",  fallbackText: "Fingerprint+Devices",  href: "/products/fingerprint",    ctaLabel: "Explore Fingerprint Devices" },
  { src: "/images/carousel/slide2.jpg", alt: "Face Recognition",     fallbackText: "Face+Recognition",     href: "/products/face",           ctaLabel: "Explore Face Recognition" },
  { src: "/images/carousel/slide3.jpg", alt: "EM Locks",             fallbackText: "EM+Locks",             href: "/products/em-locks",       ctaLabel: "Explore EM Locks" },
  { src: "/images/carousel/slide4.jpg", alt: "Metal Detectors",      fallbackText: "Metal+Detectors",      href: "/products/metal-detectors", ctaLabel: "Explore Metal Detectors" },
  { src: "/images/carousel/slide5.jpg", alt: "Flap Barriers",        fallbackText: "Flap+Barriers",        href: "/products/flap-barriers",  ctaLabel: "Explore Flap Barriers" },
  { src: "/images/carousel/slide6.jpg", alt: "Hotel Locks",          fallbackText: "Hotel+Locks",          href: "/products/hotel-lock",     ctaLabel: "Explore Hotel Locks" },
  { src: "/images/carousel/slide7.jpg", alt: "RFID Readers",         fallbackText: "RFID+Readers",         href: "/products/rfid-readers",   ctaLabel: "Explore RFID Readers" },
  { src: "/images/carousel/slide8.jpg", alt: "Safe Locks",           fallbackText: "Safe+Locks",           href: "/products/safe-lock",      ctaLabel: "Explore Safe Locks" },
];

export function HeroCarousel({ slides }: { slides?: Slide[] }) {
  const SLIDES = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const go = (i: number) =>
    setCurrent(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

  return (
    <section className="hero-carousel">
      <div className="carousel-container" id="heroCarousel">
        <div className="carousel-slides">
          {SLIDES.map((s, i) => (
            <div
              key={s.src}
              className={`carousel-slide ${i === current ? "active" : ""}`}
            >
              <div className="slide-content">
                <img
                  src={s.src}
                  alt={s.alt}
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/1920x600/1a365d/ffffff?text=${s.fallbackText}`;
                  }}
                />
                <div className="slide-btn-wrap">
                  <Link href={s.href} className="btn btn-primary">
                    {s.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          className="carousel-control prev"
          onClick={() => go(current - 1)}
          aria-label="Previous slide"
        >
          <i className="fas fa-chevron-left" />
        </button>
        <button
          className="carousel-control next"
          onClick={() => go(current + 1)}
          aria-label="Next slide"
        >
          <i className="fas fa-chevron-right" />
        </button>
        <div className="carousel-indicators">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`indicator ${i === current ? "active" : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
