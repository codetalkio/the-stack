// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
