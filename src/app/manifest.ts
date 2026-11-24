import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.MAPTOC_STATIC_EXPORT === "1" ? "/demo" : "";
  return { name: "MapToc Outcome Intelligence", short_name: "MapToc", description: "Capture documents, review evidence and preserve program memory.", start_url: `${base}/dashboard/`, scope: `${base}/`, display: "standalone", background_color: "#f5f7f8", theme_color: "#09181c", icons: [{ src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }] };
}
