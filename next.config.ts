import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "C:/Users/movva/Documents/GitHub/kinder",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'oxuusvdkgxdepaaaiimh.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
