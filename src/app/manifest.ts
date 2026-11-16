import type { MetadataRoute } from "next";

// 009 G7: name, icons, and colors for the browser and the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life Manager",
    short_name: "Life Manager",
    description: "Plan, live, and review your days.",
    start_url: "/day",
    display: "standalone",
    background_color: "#f2eee7",
    theme_color: "#7a3e1d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
