import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ApiProvider } from "@/lib/api/query-client";
import "./globals.css";

// 005 D4: DM Sans, self-hosted at build time (no request to Google at runtime).
const sans = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Life Manager",
  description: "Plan, live, and review your days.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2eee7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1917" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"}>
          <ApiProvider>{children}</ApiProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
