import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud StanOS",
  description: "Life Manager daily timeline prototype.",
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
