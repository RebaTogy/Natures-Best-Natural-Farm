import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nature's Best Natural Farm | Farm-to-Table Transparency",
  description: "Experience the journey from our farm to your kitchen. Buy organic heritage spelt, wild lavender honey, and heirloom vegetables with batch-level traceability.",
  keywords: ["organic wheat", "raw honey", "organic farm", "traceability", "pre-book harvest", "nature's best"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-farm-cream-100 text-farm-green-950 font-sans">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-grow flex flex-col">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
