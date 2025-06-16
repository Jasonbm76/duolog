/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Suppress the "Critical dependency" warning from @supabase/realtime-js
    config.module.exprContextCritical = false;
    
    // Add fallback for Node.js modules that might be used in edge runtime
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    
    return config;
  },
  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],
}

export default nextConfig
