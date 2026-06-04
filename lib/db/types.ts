export type RunResult = {
  insertId: number | null;
  rowsAffected: number;
};

export interface DbDriver {
  /** Return all rows. Uses `?` placeholders; driver converts to dialect-specific. */
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Return the first row, or undefined. */
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  /** Execute a statement that doesn't return rows. */
  run(sql: string, params?: unknown[]): Promise<RunResult>;
  /** Idempotent schema bootstrap. Safe to call on every cold start. */
  init(): Promise<void>;
}

export type ProductSpec = {
  id: number;
  product_id: string;
  spec_key: string;
  spec_value: string;
  display_order: number;
};

export type ProductDownload = {
  id: number;
  product_id: string;
  file_title: string;
  file_url: string;
  file_type: string;
  file_size: string;
  display_order: number;
};

export type ProductFeature = {
  id: number;
  product_id: string;
  feature: string;
  display_order: number;
};

export type AdminUser = {
  id: number;
  username: string;
  password_hash: string;
};

export type Review = {
  id: number;
  name: string;
  company: string | null;
  designation: string | null;
  rating: number;
  review: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type ContactEnquiry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  product: string | null;
  requirement: string;
  created_at: string;
  email_sent: number | null;
  email_error: string | null;
};

/**
 * Per-product overrides editable from the admin panel: brand + display order.
 * Joined against the static product list to enrich it.
 */
export type ProductMeta = {
  id: number;
  product_id: string;
  brand: string | null;
  display_order: number;
  image_url: string | null;
  name_override: string | null;
  is_hidden: number;
  category_override: string | null;
};

export type CustomCategory = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  display_order: number;
  created_at: string;
};

export type CustomProduct = {
  id: number;
  product_id: string;
  category_slug: string;
  name: string;
  short_desc: string | null;
  created_at: string;
};

export type CustomBrand = {
  id: number;
  slug: string;
  name: string;
  created_at: string;
};

export type FeaturedProduct = {
  id: number;
  product_id: string;
  display_order: number;
};

export type CarouselSlide = {
  id: number;
  image_url: string;
  button_label: string;
  category_slug: string;
  display_order: number;
};

export type SiteDownload = {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: string;
  category: string;
  display_order: number;
};

export type ProductImage = {
  id: number;
  product_id: string;
  image_url: string;
  display_order: number;
};

export type GalleryImage = {
  id: number;
  image_url: string;
  title: string;
  location: string | null;
  display_order: number;
  created_at: string;
};

export type GalleryVideo = {
  id: number;
  youtube_id: string;
  title: string;
  display_order: number;
  created_at: string;
};

export type BrandLogo = {
  brand_slug: string;
  logo_url: string;
  updated_at: string;
};
