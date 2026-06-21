/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática para servir en Firebase Hosting.
  output: 'export',
  reactStrictMode: false,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
