import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongoose', 'pdfkit', 'bcryptjs'],
};

export default nextConfig;
