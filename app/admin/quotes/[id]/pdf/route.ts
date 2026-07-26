import { NextResponse } from "next/server";
import { hasQuoteAccess } from "@/lib/auth";
import { getQuote, toInput } from "@/lib/data/quotes-server";
import { fullQuoteId } from "@/lib/data/quotes";
import { renderQuotePdf } from "@/lib/quote/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await hasQuoteAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quote = await getQuote(Number(id));
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const buffer = await renderQuotePdf(toInput(quote));
    const filename = `Quotation-${fullQuoteId(quote.quote_number, quote.version)}-${quote.client_name.replace(/[^a-z0-9]+/gi, "_")}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[quote pdf]", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
