// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Other config options can go here (e.g., reactStrictMode, etc.)

  async headers() {
    return [
      {
        source: '/api/:path*', // Apply to all API routes
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://new-yes-city-backend.vercel.app', // 🔁 Replace with actual frontend URL
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
