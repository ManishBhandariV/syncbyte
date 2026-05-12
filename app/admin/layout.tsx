// The admin section uses its own self-contained layout (no public header/footer).
// Tailwind/legacy CSS from the root layout are still available.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
