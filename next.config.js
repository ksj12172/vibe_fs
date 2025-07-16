/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.brand.dev',
      },
    ],
  },
  rewrites: async () => {
    return [
      {
        source: '/api/stock-data/:code',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:5001/api/stock-data/:code'
            : '/api/stock-data/:code',
      },
    ];
  },
};

module.exports = nextConfig;
