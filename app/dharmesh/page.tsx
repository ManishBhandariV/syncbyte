import { redirect } from "next/navigation";
import { getDharmeshSession } from "@/lib/auth";
import { DharmeshLogin } from "@/components/DharmeshLogin";

export const metadata = { title: "Quotation Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DharmeshHome() {
  const session = await getDharmeshSession();
  if (session) redirect("/dharmesh/quotes");
  return <DharmeshLogin />;
}
