import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move .next to a local drive location to avoid slow filesystem warnings
  // Uncomment the line below if you have a faster local drive (e.g., C:\temp)
  // distDir: process.env.NODE_ENV === 'production' ? '.next' : 'C:/temp/welloh-next',
};

export default nextConfig;
