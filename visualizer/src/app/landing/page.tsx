import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import LandingPage from "@/components/landing/LandingPage";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-l",
});

export const metadata: Metadata = {
  title: "Foundry Brain — find the machine that broke your yield",
  description:
    "An AI yield engineer for semiconductor fabs. It walks the fab's three disconnected data systems, names the root-cause chamber with evidence, and recommends hold or ship — in minutes.",
};

export default function Landing() {
  return (
    <div className={`${displayFont.variable} ${monoFont.variable}`}>
      <LandingPage />
    </div>
  );
}
