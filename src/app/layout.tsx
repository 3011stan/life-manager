import type { Metadata, Viewport } from "next";
import { ApiProvider } from "@/lib/api/query-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Manager",
  description: "Plan, live, and review your days.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ApiProvider>{children}</ApiProvider>
      </body>
    </html>
  );
}
