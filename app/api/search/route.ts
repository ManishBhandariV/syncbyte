import { NextResponse } from "next/server";
import { search } from "@/lib/data/search";
import { getProductImage } from "@/lib/data/images";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = search(q)
    .filter((r) => r.type === "product")
    .slice(0, 8)
    .map((r) => ({
      name: r.name,
      category: r.category,
      url: r.url,
      // r is narrowed to product variant above
      image: getProductImage((r as Extract<typeof r, { type: "product" }>).id),
    }));
  return NextResponse.json({ results });
}
