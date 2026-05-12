"use client";

import { usePathname } from "next/navigation";

export function BackToTop() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) return null;
  return (
    <button className="back-to-top" id="backToTop" title="Back to Top" aria-label="Back to top">
      <i className="fas fa-chevron-up" />
    </button>
  );
}
