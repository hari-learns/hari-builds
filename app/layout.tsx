import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./styles/globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Hari — Freelancer",
  description: "Hari is a freelancer. Reach out at hariharanrp.dev@gmail.com.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
