/**
 * Pulls reviews from the Google Places API for the Syncbyte business listing.
 * Falls back to a static set if the API key isn't configured.
 *
 * Setup (do once on Vercel):
 *  1. Go to Google Cloud Console → enable "Places API (New)" on your project.
 *  2. Create an API key, restrict it to your domain or to backend (Server) only.
 *  3. Find your place_id at https://developers.google.com/maps/documentation/places/web-service/place-id
 *     (or use the existing Maps embed URL — the place_id is in the data param).
 *  4. Add env vars:
 *       GOOGLE_PLACES_API_KEY=your-key
 *       GOOGLE_PLACE_ID=ChIJ...
 *  5. Redeploy. Reviews will appear automatically.
 */

export type GoogleReview = {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  profile_photo_url?: string;
};

/**
 * URL that opens Google's "Write a review" sheet for the configured business.
 * Uses GOOGLE_PLACE_ID when available (most reliable), otherwise falls back to
 * a Google search for the business name — the user can still click "Write a
 * review" from the knowledge panel.
 */
export function getWriteReviewUrl(): string {
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }
  return "https://www.google.com/search?q=Syncbyte+Innovations+Private+Limited+Bangalore";
}

const FALLBACK_REVIEWS: GoogleReview[] = [
  { author_name: "Rajesh Kumar", rating: 5, relative_time_description: "2 weeks ago",  text: "Excellent biometric solutions! Installation was smooth and the support team is very responsive." },
  { author_name: "Priya Sharma", rating: 5, relative_time_description: "1 month ago",  text: "Top quality products and great after-sales service. Highly recommend Syncbyte for access control." },
  { author_name: "Anand Mehta",  rating: 5, relative_time_description: "3 months ago", text: "Installed their face recognition system in our office. Works flawlessly. Great team!" },
];

export async function getGoogleReviews(): Promise<{
  reviews: GoogleReview[];
  isReal: boolean;
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.warn(
      "[google-reviews] env vars missing — falling back to placeholder reviews. " +
        `apiKey=${apiKey ? "set" : "MISSING"}, placeId=${placeId ? "set" : "MISSING"}`,
    );
    return { reviews: FALLBACK_REVIEWS, isReal: false };
  }

  try {
    // Places API (New) — POST endpoint with field mask for reviews.
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        `[google-reviews] API ${res.status} — ${body.slice(0, 300)}`,
      );
      return { reviews: FALLBACK_REVIEWS, isReal: false };
    }
    const data = (await res.json()) as {
      reviews?: Array<{
        rating: number;
        text?: { text?: string };
        originalText?: { text?: string };
        relativePublishTimeDescription?: string;
        authorAttribution?: {
          displayName?: string;
          photoUri?: string;
        };
      }>;
    };
    const reviews: GoogleReview[] = (data.reviews ?? []).map((r) => ({
      author_name: r.authorAttribution?.displayName ?? "Anonymous",
      rating: r.rating ?? 5,
      relative_time_description: r.relativePublishTimeDescription ?? "",
      text: r.text?.text ?? r.originalText?.text ?? "",
      profile_photo_url: r.authorAttribution?.photoUri,
    }));
    return { reviews: reviews.length > 0 ? reviews : FALLBACK_REVIEWS, isReal: reviews.length > 0 };
  } catch (e) {
    console.warn("[google-reviews] fetch failed", e);
    return { reviews: FALLBACK_REVIEWS, isReal: false };
  }
}
