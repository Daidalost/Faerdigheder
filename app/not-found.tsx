import Link from "next/link";

export default function IkkeFundet() {
  return (
    <main className="side">
      <h1 className="titel">Siden findes ikke</h1>
      <p className="manchet">Linket peger et sted hen, der ikke er noget.</p>
      <p style={{ marginTop: 22 }}>
        <Link className="knap" href="/" style={{ ["--accent" as string]: "var(--terra)" }}>
          Til forsiden
        </Link>
      </p>
    </main>
  );
}
