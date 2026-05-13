"use client";

import { useState } from "react";
import {
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  saveGalleryVideo,
  deleteGalleryVideo,
} from "@/app/admin/actions";
import type { GalleryImage, GalleryVideo } from "@/lib/db/types";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.88rem",
};

export function GalleryAdminClient({
  images,
  videos,
}: {
  images: GalleryImage[];
  videos: GalleryVideo[];
}) {
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<GalleryVideo> | null>(null);

  return (
    <>
      {/* ── Images ────────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f0f4f8" }}>
          <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
            <i className="fas fa-images" /> Project Photos
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
            Upload installation photos and project work. They appear on the public Gallery page.
          </p>
        </div>

        <form
          action={uploadGalleryImage}
          encType="multipart/form-data"
          style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto 1fr auto", gap: 10, alignItems: "end", marginBottom: 20 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Title</label>
            <input name="title" required placeholder="e.g. Corporate Office Installation" style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Location</label>
            <input name="location" placeholder="e.g. Bangalore" style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Order</label>
            <input name="display_order" type="number" defaultValue={0} style={{ ...inputStyle, width: 80 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Image</label>
            <input type="file" name="image" accept="image/*" required style={{ fontSize: "0.85rem" }} />
          </div>
          <button
            type="submit"
            style={{
              background: "#10b981", color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            <i className="fas fa-upload" /> Upload
          </button>
        </form>

        {images.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
            <i className="fas fa-inbox" style={{ fontSize: "2rem", marginBottom: 8, display: "block" }} />
            No gallery images yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {images.map((img) => (
              <div
                key={img.id}
                style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#fafbfc" }}
              >
                <img
                  src={img.image_url}
                  alt={img.title}
                  style={{ width: "100%", height: 140, objectFit: "cover", display: "block", background: "#f1f5f9" }}
                />
                <div style={{ padding: 10 }}>
                  {editingImage?.id === img.id ? (
                    <form action={updateGalleryImage} style={{ display: "grid", gap: 6 }}>
                      <input type="hidden" name="id" value={img.id} />
                      <input name="title" defaultValue={img.title} required style={inputStyle} />
                      <input name="location" defaultValue={img.location ?? ""} placeholder="Location" style={inputStyle} />
                      <input name="display_order" type="number" defaultValue={img.display_order} style={inputStyle} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="submit"
                          style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: "0.78rem", cursor: "pointer", flex: 1 }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingImage(null)}
                          style={{ background: "#e2e8f0", color: "#1a365d", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: "0.78rem", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a365d", marginBottom: 2 }}>{img.title}</div>
                      {img.location && (
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 8 }}>
                          <i className="fas fa-map-marker-alt" /> {img.location}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingImage(img)}
                          style={{ background: "#e0f2fe", color: "#0369a1", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer", flex: 1 }}
                        >
                          <i className="fas fa-edit" /> Edit
                        </button>
                        <form action={deleteGalleryImage} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={img.id} />
                          <button
                            type="submit"
                            onClick={(e) => { if (!confirm("Delete this photo?")) e.preventDefault(); }}
                            style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── YouTube videos ────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div
          style={{
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "2px solid #f0f4f8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1rem", color: "#1a365d" }}>
              <i className="fab fa-youtube" /> Pinned YouTube videos
            </h3>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
              Pinned videos appear first; the rest are pulled live from the @syncbyte9550 channel feed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingVideo({})}
            style={{
              background: "#1a365d", color: "#fff", border: "none", borderRadius: 8,
              padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            <i className="fas fa-plus" /> Add Video
          </button>
        </div>

        {editingVideo && (
          <form
            action={async (fd: FormData) => {
              if (editingVideo.id) fd.set("id", String(editingVideo.id));
              await saveGalleryVideo(fd);
              setEditingVideo(null);
            }}
            style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto auto", gap: 10, alignItems: "end", marginBottom: 20, padding: 14, background: "#f8fafc", borderRadius: 8 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>YouTube URL or video ID</label>
              <input
                name="youtube_url"
                defaultValue={
                  editingVideo.youtube_id
                    ? `https://youtu.be/${editingVideo.youtube_id}`
                    : ""
                }
                placeholder="https://youtu.be/... or 11-char ID"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Title</label>
              <input name="title" defaultValue={editingVideo.title ?? ""} required style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Order</label>
              <input name="display_order" type="number" defaultValue={editingVideo.display_order ?? 0} style={inputStyle} />
            </div>
            <button
              type="submit"
              style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingVideo(null)}
              style={{ background: "#e2e8f0", color: "#1a365d", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
          </form>
        )}

        {videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
            <i className="fab fa-youtube" style={{ fontSize: "2rem", marginBottom: 8, display: "block" }} />
            No pinned videos. The Gallery still auto-shows videos from your channel.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Thumb", "Title", "Video ID", "Order", "Actions"].map((h) => (
                  <th key={h} style={{ background: "#f8fafc", padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <td style={{ padding: "8px 12px" }}>
                    <img src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`} alt="" style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 4 }} />
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "0.88rem" }}>
                    <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noopener" style={{ color: "#1a365d", fontWeight: 600 }}>
                      {v.title}
                    </a>
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "0.78rem", color: "#94a3b8", fontFamily: "monospace" }}>
                    {v.youtube_id}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "0.88rem" }}>{v.display_order}</td>
                  <td style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setEditingVideo(v)}
                      style={{ background: "#e0f2fe", color: "#0369a1", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <form action={deleteGalleryVideo} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={v.id} />
                      <button
                        type="submit"
                        onClick={(e) => { if (!confirm("Delete this video?")) e.preventDefault(); }}
                        style={{ background: "#ef4444", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" }}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
