import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Manager",
  description: "Plan, live, and review your days.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
