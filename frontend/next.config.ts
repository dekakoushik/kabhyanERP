import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // In production Docker, proxy /api/v1 to the backend container over internal Docker network
    const backendHost = process.env.INTERNAL_BACKEND_URL || "http://backend:80";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendHost}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
