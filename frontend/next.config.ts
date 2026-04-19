import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ['mongoose', 'pdfkit', 'bcryptjs'],
  ...(process.env.NODE_ENV === 'production'
    ? { compiler: { removeConsole: { exclude: ['error', 'warn'] } } }
    : {}),
};

export default nextConfig;
