import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const broed = localFont({
  src: [
    { path: "../public/fonts/carlito-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/carlito-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--skrift-broed",
  display: "swap",
});

const overskrift = localFont({
  src: [
    { path: "../public/fonts/poppins-medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/poppins-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--skrift-overskrift",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Færdigheder — matematik uden hjælpemidler",
  description:
    "Træn regnestrategier og enhedsomregning op mod folkeskolens prøve i matematik uden hjælpemidler.",
};

export const viewport: Viewport = {
  themeColor: "#f0f5f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${broed.variable} ${overskrift.variable}`}>
      <body>{children}</body>
    </html>
  );
}
