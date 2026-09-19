import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, Turbopack walks up and picks a lockfile in the home
  // directory as the workspace root.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
