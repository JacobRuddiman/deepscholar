/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "isomorphic-dompurify",
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth"
  ],

  // Skip ESLint during builds (run separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,
  compress: true,

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize client-side bundle
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor splitting
            default: false,
            vendors: false,

            // React and Next.js core
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // Common libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(/** @type {any} */ module) {
                const match = module.context?.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                );
                if (!match) return 'npm.unknown';
                return `npm.${match[1].replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },

            // Shared components
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // In dev: allow unsafe-inline and unsafe-eval for Fast Refresh and HMR
              // In prod: strict CSP for XSS protection
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com"
                : "script-src 'self' https://vercel.live https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com",
              // Note: 'unsafe-inline' still needed for Tailwind and component styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // FIXED: Restricted img-src to specific whitelisted domains
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://cdn.discordapp.com https://avatars.githubusercontent.com https://*.supabase.co https://www.google.com",
              "media-src 'self' data: blob:",
              isDev
                ? "connect-src 'self' http://localhost:* ws://localhost:* https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com https://*.supabase.co"
                : "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com https://*.supabase.co https://www.google-analytics.com",
              "frame-src 'self' https://vercel.live",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              isDev ? "" : "upgrade-insecure-requests",
              // ADDED: CSP violation reporting endpoint
              "report-uri /api/csp-report"
            ].filter(Boolean).join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // ADDED: HSTS header for HTTPS enforcement
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
