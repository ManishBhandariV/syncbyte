"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-scrolling client logo strip with manual prev/next arrows.
 * Shows every logo passed in (no cap). Auto-scroll pauses on hover/touch.
 */
export function CustomersCarousel({ logos }: { logos: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const manualPauseUntilRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const SPEED = 0.9; // px per frame (~54px/s) — noticeably faster than before

    const step = () => {
      const now = performance.now();
      const manuallyPaused = now < manualPauseUntilRef.current;
      if (!pausedRef.current && !manuallyPaused && track) {
        track.scrollLeft += SPEED;
        // Loop: the list is duplicated, so reset at the halfway point.
        const half = track.scrollWidth / 2;
        if (track.scrollLeft >= half) {
          track.scrollLeft -= half;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nudge = (dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    // Pause the auto-scroll RAF for ~1s so it doesn't immediately cancel the
    // smooth-scroll the browser is animating.
    manualPauseUntilRef.current = performance.now() + 1000;
    track.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  // Duplicate the list so the loop is seamless.
  const all = [...logos, ...logos];

  return (
    <div className="customers-carousel-wrap">
      <button
        type="button"
        className="customers-arrow prev"
        aria-label="Previous logos"
        onClick={() => nudge(-1)}
      >
        <i className="fas fa-chevron-left" />
      </button>

      <div
        className="customers-carousel"
        ref={trackRef}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onTouchStart={() => (pausedRef.current = true)}
        onTouchEnd={() => (pausedRef.current = false)}
        style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}
      >
        {all.map((logo, i) => (
          <div className="customer-logo" key={`${logo}-${i}`}>
            <img src={logo} alt="Client logo" />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="customers-arrow next"
        aria-label="Next logos"
        onClick={() => nudge(1)}
      >
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  );
}
