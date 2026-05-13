import { ImageResponse } from "next/og";

// App Router convention: a default-exported component at app/icon.tsx is
// auto-served at /icon and wired in as the page favicon.
// We render an "S" mark in the Syncbyte brand color.

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a365d 0%, #0ea5e9 100%)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: 44,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          borderRadius: 8,
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
