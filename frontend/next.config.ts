import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow the FastAPI backend to serve heatmap images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/heatmaps/**',
      },
    ],
  },
  // Proxy /api/* to FastAPI in development (optional — uses direct URL by default)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
