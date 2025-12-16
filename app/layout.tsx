import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Orbitron, IBM_Plex_Mono, Audiowide, Chakra_Petch, Rajdhani, Exo_2 } from "next/font/google";
import "./styles/globals.css";
import { ThemeProvider } from "./context/ThemeContext";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex",
  weight: ['300', '400', '500'],
  subsets: ["latin"],
});

const audiowide = Audiowide({
  variable: "--font-audiowide",
  weight: '400',
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  weight: ['400', '600', '700'],
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ['400', '600', '700'],
  subsets: ["latin"],
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
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
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${orbitron.variable} ${ibmPlexMono.variable} ${audiowide.variable} ${chakraPetch.variable} ${rajdhani.variable} ${exo2.variable} antialiased bg-[#0a0a0f] text-[#e4e4e7]`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
