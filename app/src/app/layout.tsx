import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Brume | Sovereignty through silence",
    template: "%s · Brume",
  },
  description:
    "Brume is a Solana wallet with privacy by default: shielded transfers, governed agentic wallets, and modular add-ons. brume.cash",
  metadataBase: new URL("https://brume.cash"),
  openGraph: {
    title: "Brume | Sovereignty through silence",
    description:
      "Shield by default. Governed agents. Public is the feature you opt into.",
    url: "https://brume.cash",
    siteName: "Brume",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brume | Sovereignty through silence",
    description:
      "Shield by default. Governed agents. Modular add-ons on private rails.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable}`}>
      <body className="selection-brume font-sans">{children}</body>
    </html>
  );
}
