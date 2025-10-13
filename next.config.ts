import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better Docker compatibility
  output: 'standalone',
  
  // Optimize for production
  experimental: {
    // External packages that should not be bundled
    serverComponentsExternalPackages: ['accessibility-checker']
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SCANNER_API_URL: process.env.NEXT_PUBLIC_SCANNER_API_URL,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
