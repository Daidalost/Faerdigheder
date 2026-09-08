import { notFound } from "next/navigation";
import RundeSide from "@/components/Runde";
import { KATALOG, findEmne, findKategori } from "@/lib/katalog";
import { NIVEAUER } from "@/lib/typer";

export function generateStaticParams() {
  return KATALOG.flatMap((k) =>
    k.emner.flatMap((e) =>
      NIVEAUER.map((n) => ({ kategori: k.id, emne: e.id, niveau: n.id })),
    ),
  );
}

export default async function Side({
  params,
}: {
  params: Promise<{ kategori: string; emne: string; niveau: string }>;
}) {
  const { kategori, emne, niveau } = await params;
  const k = findKategori(kategori);
  const e = findEmne(kategori, emne);
  const n = NIVEAUER.find((x) => x.id === niveau);
  if (!k || !e || !n) notFound();
  return <RundeSide kategori={k} emne={e} niveau={n} />;
}
