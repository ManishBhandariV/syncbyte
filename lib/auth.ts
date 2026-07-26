import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "syncbyte_admin";
const DHARMESH_COOKIE = "syncbyte_dharmesh";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  // Dev fallback — warns once. Production should always set SESSION_SECRET.
  if (!process.env.SESSION_SECRET) {
    console.warn(
      "[auth] SESSION_SECRET not set — using insecure dev fallback. " +
        "Set SESSION_SECRET to a random 32+ char string in production.",
    );
  }
  return "syncbyte-dev-secret-not-for-production-use";
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export type Session = { username: string; exp: number };

function encode(session: Session): string {
  const payload = `${session.username}.${session.exp}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function decode(token: string): Session | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const payload = Buffer.from(b64, "base64url").toString("utf8");
  const expected = sign(payload);
  // constant-time compare
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  const [username, expStr] = payload.split(".");
  const exp = Number(expStr);
  if (!username || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return { username, exp };
}

export async function getSession(cookieName: string = COOKIE_NAME): Promise<Session | null> {
  const c = await cookies();
  const token = c.get(cookieName)?.value;
  if (!token) return null;
  return decode(token);
}

export async function setSession(username: string, cookieName: string = COOKIE_NAME): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const token = encode({ username, exp });
  const c = await cookies();
  c.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(cookieName: string = COOKIE_NAME): Promise<void> {
  const c = await cookies();
  c.delete(cookieName);
}

// ── Dharmesh session (separate, quote-only login at /dharmesh) ────────────────
export const getDharmeshSession = () => getSession(DHARMESH_COOKIE);
export const setDharmeshSession = (username: string) => setSession(username, DHARMESH_COOKIE);
export const clearDharmeshSession = () => clearSession(DHARMESH_COOKIE);

/**
 * Anyone allowed to use the quotation builder: a main admin OR the Dharmesh
 * quote-only user. Used to guard quote actions and the PDF/Word download routes.
 */
export async function hasQuoteAccess(): Promise<Session | null> {
  return (await getSession()) ?? (await getDharmeshSession());
}
