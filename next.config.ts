import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Enable standalone output for Docker
  // Prevent Turbopack from selecting the wrong workspace root (which can break .env loading)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
