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
};
