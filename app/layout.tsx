import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CompareBar } from "@/components/comparison/CompareBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarResearch — Find your perfect car",
  description: "A friendly car research tool that helps you find, compare, and budget for your next car.",
};

// ─── SLOT: Feature 8 (Landing / Layout) — real SiteHeader ───
function SiteHeaderSlot() {
  return <SiteHeader />;
}

// ─── SLOT: Feature 3 (Comparison) — real CompareBar ───
function CompareBarSlot() {
  return <CompareBar />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeaderSlot />
        <main className="flex-1">{children}</main>
        {/* CompareBar floats above everything — keep it outside <main> */}
        <CompareBarSlot />
      </body>
    </html>
  );
}
