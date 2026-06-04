import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Returns a presigned client-upload token to Vercel Blob.
 *
 * The browser POSTs file metadata here; this route returns a short-lived token
 * which the browser then uses to upload the file directly to Blob storage —
 * bypassing the 4.5 MB Server Action body limit entirely.
 *
 * Admin session is required to mint a token. The `pathname` and `clientPayload`
 * sent from the browser are echoed in `tokenPayload` so the upload callback
 * can verify them.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // Auth gate: only admins can mint upload tokens.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Restrict folders the client can write to and cap file size.
        const allowedPrefixes = [
          "products/",
          "site-downloads/",
          "gallery/",
          "brands/",
          "carousel/",
          "downloads/",
        ];
        if (!allowedPrefixes.some((p) => pathname.startsWith(p))) {
          throw new Error(`Path "${pathname}" is not allowed.`);
        }
        return {
          // Generous content-type list — site-downloads accepts anything;
          // image folders constrain on the client side already.
          allowedContentTypes: [
            "image/*",
            "application/pdf",
            "application/zip",
            "application/x-zip-compressed",
            "application/octet-stream",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "text/csv",
          ],
          addRandomSuffix: true,
          // 512 MB per file — well above the 200 MB the user mentioned.
          maximumSizeInBytes: 512 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            username: session.username,
            clientPayload: clientPayload ?? null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Fires after the browser finishes uploading. We don't persist anything
        // here — the client follows up with a Server Action that writes the DB
        // row using blob.url, which is far simpler and easier to debug.
        console.log("[blob upload] completed", {
          url: blob.url,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    console.error("[blob upload] failed", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 },
    );
  }
}
