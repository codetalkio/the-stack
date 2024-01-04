// @ts-check
const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = withNextIntl({
  output: 'export',
  trailingSlash: true,
  experimental: {
    // Not supported with Turbo yet.
    typedRoutes: true,
  },
});

module.exports = nextConfig;
