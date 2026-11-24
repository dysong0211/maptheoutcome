import type { NextConfig } from "next";

if (
  process.env.MAPTOC_STATIC_EXPORT === "1" &&
  process.env.MAPTOC_REQUIRE_AUTH === "true"
) {
  throw new Error(
    "Pilot authentication requires the server-backed Next.js deployment; static export cannot protect app pages or the AI route.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.MAPTOC_STATIC_EXPORT !== "1" && process.env.MAPTOC_BASE_PATH
    ? { basePath: process.env.MAPTOC_BASE_PATH }
    : {}),
  distDir:
    process.env.MAPTOC_STATIC_EXPORT === "1"
      ? "out"
      : process.env.MAPTOC_BUILD_DIR || ".next",
  ...(process.env.MAPTOC_STATIC_EXPORT === "1"
    ? {
        output: "export",
        basePath: process.env.MAPTOC_DEMO_BASE_PATH ?? "/demo",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_WEBSITE_HOME:
      process.env.MAPTOC_STATIC_EXPORT === "1"
        ? "/"
        : process.env.NEXT_PUBLIC_WEBSITE_HOME || "https://maptoc.org",
  },
};

export default nextConfig;
