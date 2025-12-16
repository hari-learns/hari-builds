import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import { ThemeProvider } from "./context/ThemeContext";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: "Hariharan | SDE",
  description: "Portfolio of an AI-Native Developer building the future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
