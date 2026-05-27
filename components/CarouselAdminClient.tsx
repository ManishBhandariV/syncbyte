"use client";

import { useActionState } from "react";
import {
  uploadCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  type ActionResult,
} from "@/app/admin/actions";
import { FormBanner } from "@/components/FormBanner";
import type { CarouselSlide } from "@/lib/db/types";

const INITIAL: ActionResult | null = null;

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.88rem",
};

export function CarouselAdminClient({
  slides,
  categories,
}: {
  slides: CarouselSlide[];
  categories: Array<{ slug: string; name: string }>;
}) {
  const [result, uploadAction, pending] = useActionState(uploadCarouselSlide, INITIAL);

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
          <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
            <i className="fas fa-images" /> Add a carousel slide
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
            Upload a wide banner image (recommended ~1920×600). Set the button label
            and which category opens when the button is clicked. If no slides are added,
            the bundled default slides are shown.
          </p>
        </div>

        <FormBanner result={result} />

        <form action={uploadAction} encType="multipart/form-data" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 0.7fr auto", gap: 10, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Image</label>
            <input type="file" name="image" accept="image/*" required style={{ fontSize: "0.85rem" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Button label</label>
            <input name="button_label" placeholder="Explore Fingerprint Devices" required style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Opens category</label>
            <select name="category_slug" defaultValue="" style={inputStyle}>
              <option value="">All products</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Order</label>
            <input type="number" name="display_order" defaultValue={slides.length} style={inputStyle} />
          </div>
          <button type="submit" disabled={pending} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: pending ? "wait" : "pointer", opacity: pending ? 0.7 : 1 }}>
            <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-upload"}`} /> {pending ? "Uploading…" : "Add Slide"}
          </button>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {slides.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No custom slides yet — bundled defaults are showing on the home page.</p>
        ) : (
          slides.map((s) => (
            <div key={s.id} style={{ background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              <img src={s.image_url} alt={s.button_label} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />
              <form action={updateCarouselSlide} style={{ display: "grid", gap: 6 }}>
                <input type="hidden" name="id" value={s.id} />
                <input name="button_label" defaultValue={s.button_label} style={inputStyle} />
                <select name="category_slug" defaultValue={s.category_slug} style={inputStyle}>
                  <option value="">All products</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" name="display_order" defaultValue={s.display_order} style={{ ...inputStyle, width: 70 }} />
                  <button type="submit" style={{ flex: 1, background: "#1a365d", color: "#fff", border: "none", borderRadius: 6, padding: "7px 10px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                    <i className="fas fa-save" /> Save
                  </button>
                </div>
              </form>
              <form action={deleteCarouselSlide} style={{ marginTop: 6 }}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" onClick={(e) => { if (!confirm("Delete this slide?")) e.preventDefault(); }} style={{ width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                  <i className="fas fa-trash" /> Delete slide
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </>
  );
}
