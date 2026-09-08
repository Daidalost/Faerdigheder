import { notFound } from "next/navigation";
import KategoriSide from "@/components/KategoriSide";
import { KATALOG, findKategori } from "@/lib/katalog";

export function generateStaticParams() {
  return KATALOG.map((k) => ({ kategori: k.id }));
}

export default async function Side({ params }: { params: Promise<{ kategori: string }> }) {
  const { kategori } = await params;
  const data = findKategori(kategori);
  if (!data) notFound();
  return <KategoriSide kategori={data} />;
}
