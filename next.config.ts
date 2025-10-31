import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Aumentar el límite de body para todas las rutas API
    serverActions: {
      bodySizeLimit: '150mb',
    },
  },
};

export default nextConfig;
