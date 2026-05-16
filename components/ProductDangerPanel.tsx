"use client";

import { deleteCustomProduct, setProductHidden } from "@/app/admin/actions";

type Props = {
  productId: string;
  productName: string;
  isCustom: boolean;
  isHidden: boolean;
};

export function ProductDangerPanel({
  productId,
  productName,
  isCustom,
  isHidden,
}: Props) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        marginBottom: 24,
        border: "1px solid #fee2e2",
      }}
    >
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #fee2e2" }}>
        <h3 style={{ fontSize: "1rem", color: "#991b1b" }}>
          <i className="fas fa-triangle-exclamation" /> Danger zone
        </h3>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
          {isCustom
            ? "This is a custom product — delete to remove it permanently along with its specs, downloads, features, and image."
            : "This is a bundled product. Hide it to remove it from the website without losing its data, or unhide later."}
        </p>
      </div>

      {isCustom ? (
        <form
          action={async (fd) => {
            if (
              !confirm(
                `Permanently delete "${productName}" and all its specs / downloads / features / image?`,
              )
            ) {
              return;
            }
            fd.set("product_id", productId);
            await deleteCustomProduct(fd);
            // Navigate away from a now-missing product.
            window.location.href = "/admin";
          }}
        >
          <button
            type="submit"
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <i className="fas fa-trash" /> Delete product
          </button>
        </form>
      ) : (
        <form
          action={async (fd) => {
            fd.set("product_id", productId);
            fd.set("hidden", isHidden ? "0" : "1");
            await setProductHidden(fd);
          }}
        >
          <button
            type="submit"
            style={{
              background: isHidden ? "#10b981" : "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <i className={`fas ${isHidden ? "fa-eye" : "fa-eye-slash"}`} />{" "}
            {isHidden ? "Unhide product (show on website)" : "Hide product (remove from website)"}
          </button>
          {isHidden && (
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 8 }}>
              This product is currently <strong>hidden</strong> from all public pages.
              Its data is preserved.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
