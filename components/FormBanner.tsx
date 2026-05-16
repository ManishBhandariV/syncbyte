"use client";

import type { ActionResult } from "@/app/admin/actions";

export function FormBanner({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  const isError = !result.ok;
  return (
    <div
      role={isError ? "alert" : "status"}
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        marginBottom: 12,
        background: isError ? "#fee2e2" : "#d1fae5",
        color: isError ? "#991b1b" : "#065f46",
        fontSize: "0.85rem",
        fontWeight: 500,
        border: `1px solid ${isError ? "#fecaca" : "#a7f3d0"}`,
      }}
    >
      <i className={`fas ${isError ? "fa-exclamation-circle" : "fa-check-circle"}`} />{" "}
      {result.message}
    </div>
  );
}
