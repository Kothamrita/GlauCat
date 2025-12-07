/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/GlauCat',
    assetPrefix: '/GlauCat',
  }),
  turbopack: {
    root: './',
  },
};

module.exports = nextConfig;
