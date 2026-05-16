"use client";

import { useState } from "react";
import type { ProductDownload } from "@/lib/db/types";

type Tab = "specifications" | "features" | "downloads";

const DOWNLOAD_ICONS: Record<string, string> = {
  pdf: "fa-file-pdf",
  doc: "fa-file-word",
  image: "fa-file-image",
  other: "fa-file",
};

type Props = {
  specifications: Array<[string, string]>;
  features: string[];
  /** Admin-managed downloads. If non-empty, replaces the catalogue/datasheet/manual default. */
  downloads?: ProductDownload[];
  /** Fallback catalogue path used when no admin downloads are configured. */
  cataloguePath: string;
  productId: string;
};

export function ProductTabs({
  specifications,
  features,
  downloads,
  cataloguePath,
  productId,
}: Props) {
  const [tab, setTab] = useState<Tab>("specifications");
  const hasCustomDownloads = downloads && downloads.length > 0;

  return (
    <section className="section product-tabs-section bg-light">
      <div className="container">
        <div className="product-tabs">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${tab === "specifications" ? "active" : ""}`}
              onClick={() => setTab("specifications")}
            >
              <i className="fas fa-list-check" /> Specifications
            </button>
            <button
              className={`tab-btn ${tab === "features" ? "active" : ""}`}
              onClick={() => setTab("features")}
            >
              <i className="fas fa-star" /> Features
            </button>
            <button
              className={`tab-btn ${tab === "downloads" ? "active" : ""}`}
              onClick={() => setTab("downloads")}
            >
              <i className="fas fa-download" /> Downloads
            </button>
          </div>

          <div className="tabs-content">
            <div className={`tab-panel ${tab === "specifications" ? "active" : ""}`}>
              <h3>Technical Specifications</h3>
              <table className="specs-table">
                <tbody>
                  {specifications.map(([k, v]) => (
                    <tr key={k}>
                      <th>{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`tab-panel ${tab === "features" ? "active" : ""}`}>
              <h3>Product Features</h3>
              <div className="features-list">
                {features.map((f) => (
                  <div className="feature-item" key={f}>
                    <i className="fas fa-check-circle" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`tab-panel ${tab === "downloads" ? "active" : ""}`}>
              <h3>Product Downloads</h3>
              <div className="downloads-list">
                {hasCustomDownloads ? (
                  downloads!.map((dl) => {
                    const icon = DOWNLOAD_ICONS[dl.file_type] ?? "fa-file";
                    return (
                      <a
                        key={dl.id}
                        href={dl.file_url}
                        target="_blank"
                        rel="noopener"
                        className="download-item"
                      >
                        <div className="download-icon">
                          <i className={`fas ${icon}`} />
                        </div>
                        <div className="download-info">
                          <h4>{dl.file_title}</h4>
                          <p>
                            {dl.file_type.toUpperCase()}
                            {dl.file_size ? ` · ${dl.file_size}` : ""}
                          </p>
                        </div>
                        <div className="download-action">
                          <i className="fas fa-download" />
                        </div>
                      </a>
                    );
                  })
                ) : (
                  <>
                    <a href={cataloguePath} className="download-item" download>
                      <div className="download-icon">
                        <i className="fas fa-file-pdf" />
                      </div>
                      <div className="download-info">
                        <h4>Product Catalogue</h4>
                        <p>Complete product specifications and details</p>
                      </div>
                      <div className="download-action">
                        <i className="fas fa-download" />
                      </div>
                    </a>
                    <a
                      href={`/product-catalogues/${productId}-datasheet.pdf`}
                      className="download-item"
                      download
                    >
                      <div className="download-icon">
                        <i className="fas fa-file-lines" />
                      </div>
                      <div className="download-info">
                        <h4>Technical Datasheet</h4>
                        <p>Detailed technical specifications</p>
                      </div>
                      <div className="download-action">
                        <i className="fas fa-download" />
                      </div>
                    </a>
                    <a
                      href={`/product-catalogues/${productId}-manual.pdf`}
                      className="download-item"
                      download
                    >
                      <div className="download-icon">
                        <i className="fas fa-book" />
                      </div>
                      <div className="download-info">
                        <h4>User Manual</h4>
                        <p>Installation and operation guide</p>
                      </div>
                      <div className="download-action">
                        <i className="fas fa-download" />
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
