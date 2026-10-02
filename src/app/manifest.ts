import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Realm of Tasks",
    short_name: "Realm of Tasks",
    description:
      "A household quest board: daily deeds, weekly quests and lifelong dreams. Works in your browser, no account needed.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f110d",
    theme_color: "#0d0b08",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
