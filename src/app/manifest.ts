import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Envelope",
    short_name: "The Envelope",
    description:
      "Write a letter today. We post it on paper on the date you choose.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#7b2d26",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
