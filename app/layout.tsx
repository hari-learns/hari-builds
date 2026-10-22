import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./styles/globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Haribuilds",
  description: "Hariharan: freelance work focused on real-world effect and an anthropological perspective.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important}.scene{--p:1!important;height:auto!important}`}</style></noscript>
      </head>
      <body className={`${inter.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
