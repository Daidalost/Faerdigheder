import { notFound } from "next/navigation";
import EmneSide from "@/components/EmneSide";
import { KATALOG, findEmne, findKategori } from "@/lib/katalog";

export function generateStaticParams() {
  return KATALOG.flatMap((k) => k.emner.map((e) => ({ kategori: k.id, emne: e.id })));
}

export default async function Side({
  params,
}: {
  params: Promise<{ kategori: string; emne: string }>;
}) {
  const { kategori, emne } = await params;
  const k = findKategori(kategori);
  const e = findEmne(kategori, emne);
  if (!k || !e) notFound();
  return <EmneSide kategori={k} emne={e} />;
}
