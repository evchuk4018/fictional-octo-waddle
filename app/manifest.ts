import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Goal Tracker",
    short_name: "Goals",
    description: "Track big goals, medium milestones, and daily tasks",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#E6F0EE",
    theme_color: "#E6F0EE",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      },
      {
        src: "/icons/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml"
      }
    ]
  };
}
