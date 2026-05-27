import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { ReviewForm } from "@/components/ReviewForm";
import { loadApprovedReviews } from "@/lib/data/reviews-server";

export const metadata = { title: "Customer Reviews" };
export const revalidate = 60; // re-fetch approved reviews every minute

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReviewsPage() {
  // Only real, admin-approved reviews — no sample/dummy data.
  const customerReviews = await loadApprovedReviews();

  const totalRating = customerReviews.reduce((s, r) => s + r.rating, 0);
  const averageRating =
    customerReviews.length > 0
      ? Math.round((totalRating / customerReviews.length) * 10) / 10
      : 0;

  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  for (const r of customerReviews) {
    ratingCounts[r.rating as 1 | 2 | 3 | 4 | 5]++;
  }
  const totalReviews = customerReviews.length;

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <h1 className="page-title">Customer Reviews</h1>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Reviews</span>
          </nav>
        </div>
      </section>

      <section className="section reviews-overview">
        <div className="container">
          <div className="reviews-summary">
            <div className="rating-overview">
              <div className="average-rating">
                <span className="rating-number">{averageRating}</span>
                <div className="rating-stars">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const n = i + 1;
                    if (n <= Math.floor(averageRating))
                      return <i key={n} className="fas fa-star filled" />;
                    if (n - 0.5 <= averageRating)
                      return (
                        <i key={n} className="fas fa-star-half-alt filled" />
                      );
                    return <i key={n} className="far fa-star" />;
                  })}
                </div>
                <span className="total-reviews">
                  Based on {totalReviews} reviews
                </span>
              </div>
              <div className="rating-breakdown">
                {([5, 4, 3, 2, 1] as const).map((i) => (
                  <div className="rating-bar" key={i}>
                    <span className="rating-label">
                      {i} <i className="fas fa-star" />
                    </span>
                    <div className="bar-bg">
                      <div
                        className="bar-fill"
                        style={{
                          width:
                            totalReviews > 0
                              ? `${(ratingCounts[i] / totalReviews) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="rating-count">{ratingCounts[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="google-rating-badge">
              <img
                src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
                alt="Google"
                className="google-logo"
              />
              <p>See our reviews on Google</p>
              <a
                href={siteConfig.googleMapsLink}
                target="_blank"
                rel="noopener"
                className="btn btn-outline"
              >
                <i className="fab fa-google" /> View on Google
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section reviews-list-section bg-light">
        <div className="container">
          <div className="reviews-layout">
            <div className="reviews-list">
              <h2 className="section-title">What Our Customers Say</h2>

              {customerReviews.length === 0 && (
                <p style={{ color: "#64748b", padding: "20px 0" }}>
                  No reviews yet — be the first to share your experience using the form.
                </p>
              )}

              {customerReviews.map((r, i) => (
                <div className="review-card-large" key={`s-${i}`}>
                  <div className="review-header">
                    <div className="reviewer-avatar">
                      <i className="fas fa-user" />
                    </div>
                    <div className="reviewer-info">
                      <h4 className="reviewer-name">{r.name}</h4>
                      {r.designation && r.company && (
                        <p className="reviewer-title">
                          {r.designation} at {r.company}
                        </p>
                      )}
                    </div>
                    <div className="review-rating">
                      {Array.from({ length: 5 }).map((_, n) => (
                        <i
                          key={n}
                          className={`fas fa-star ${n < r.rating ? "filled" : "empty"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="review-content">&quot;{r.review}&quot;</p>
                  <div className="review-footer">
                    <span className="review-date">
                      <i className="fas fa-calendar" /> {formatDate(r.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="review-form-sidebar">
              <div className="review-form-card">
                <h3>Share Your Experience</h3>
                <p>
                  Your feedback helps us improve and helps others make informed decisions.
                </p>
                <ReviewForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
