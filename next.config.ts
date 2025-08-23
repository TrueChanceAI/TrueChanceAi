import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },

  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Development CSP: permissive
    const devCsp = `
      default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;
      script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
      style-src 'self' 'unsafe-inline' blob:;
      img-src 'self' data: https: blob:;
      font-src 'self' data: blob:;
      connect-src 'self' https: wss: ws: blob: data:;
      media-src 'self' blob: data:;
      worker-src 'self' blob:;
      child-src 'self' blob:;
      frame-src 'self' blob:;
      frame-ancestors 'none';
    `;

    // Production CSP: stricter
    const prodCsp = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline' blob: https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com;
      img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://flagcdn.com;
      media-src 'self' blob: data:;
      worker-src 'self' blob:;
      child-src 'self' blob:;
      frame-src 'self' blob:;
      frame-ancestors 'none';
    `;

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: (isDevelopment ? devCsp : prodCsp).replace(/\n/g, " "),
          },
        ],
      },
      // CORS headers for API routes
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://www.true-chance.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
