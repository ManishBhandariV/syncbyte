"use client";

import { useActionState } from "react";
import {
  submitEnquiry,
  type ContactFormResult,
} from "@/app/contact/actions";

const INITIAL: ContactFormResult | null = null;

export function ContactForm({ preselectedProduct }: { preselectedProduct?: string }) {
  const [state, formAction, pending] = useActionState(submitEnquiry, INITIAL);

  return (
    <>
      {state?.ok && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle" /> Thank you for your enquiry! We
          will contact you within 24 hours.
        </div>
      )}
      {state?.error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle" /> {state.error}
        </div>
      )}

      <form action={formAction} className="contact-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">
              Your Name <span className="required">*</span>
            </label>
            <input type="text" id="name" name="name" required placeholder="Enter your full name" />
          </div>
          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input type="tel" id="phone" name="phone" required placeholder="Enter your phone number" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email Address <span className="required">*</span>
          </label>
          <input type="email" id="email" name="email" required placeholder="Enter your email address" />
        </div>

        {preselectedProduct && (
          <div className="form-group">
            <label htmlFor="product">Product Interest</label>
            <input
              type="text"
              id="product"
              name="product"
              defaultValue={preselectedProduct}
              readOnly
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="requirement">
            Your Requirement <span className="required">*</span>
          </label>
          <textarea
            id="requirement"
            name="requirement"
            rows={5}
            required
            placeholder="Please describe your requirements in detail..."
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={pending}
        >
          <i className={`fas ${pending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} />{" "}
          {pending ? "Sending…" : "Send Enquiry"}
        </button>
      </form>
    </>
  );
}
