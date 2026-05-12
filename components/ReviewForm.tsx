"use client";

import { useActionState } from "react";
import { submitReview, type ReviewFormResult } from "@/app/reviews/actions";

const INITIAL: ReviewFormResult | null = null;

export function ReviewForm() {
  const [state, formAction, pending] = useActionState(submitReview, INITIAL);

  return (
    <>
      {state?.error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle" /> {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle" /> Thank you for your review! It
          will appear after moderation.
        </div>
      )}

      <form action={formAction} className="review-form">
        <div className="form-group">
          <label htmlFor="name">
            Your Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="company">Company Name</label>
          <input
            type="text"
            id="company"
            name="company"
            placeholder="Enter your company name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="designation">Designation</label>
          <input
            type="text"
            id="designation"
            name="designation"
            placeholder="Enter your designation"
          />
        </div>

        <div className="form-group">
          <label>
            Rating <span className="required">*</span>
          </label>
          <div className="star-rating-input">
            {[5, 4, 3, 2, 1].map((i) => (
              <span key={i}>
                <input type="radio" id={`star${i}`} name="rating" value={i} required />
                <label htmlFor={`star${i}`} title={`${i} stars`}>
                  <i className="fas fa-star" />
                </label>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review">
            Your Review <span className="required">*</span>
          </label>
          <textarea
            id="review"
            name="review"
            rows={5}
            required
            placeholder="Share your experience with our products or services..."
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={pending}
        >
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} />{" "}
          {pending ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </>
  );
}
