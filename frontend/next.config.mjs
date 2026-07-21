/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent build failures from TypeScript errors (recommended only for quick deployment or CI/CD pipelines)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable default Next.js image optimization (useful for static exports or external CDNs)
  images: {
    unoptimized: true,
  },

  // Proxy requests from /api/* to your external backend server
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Guard against undefined env variable during build/dev
    if (!apiUrl) {
      return [];
    }

    // Strip trailing slashes to avoid double slashes in the target URL (e.g., http://api.com//users)
    const formattedApiUrl = apiUrl.replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${formattedApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;