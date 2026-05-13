import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Hot Module Reloading from these hosts in development (fixes CORS HMR blocked warnings)
  // Add any other dev host IPs your environment uses
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.8"],

  // Move .next to a local drive location to avoid slow filesystem warnings
  // Uncomment the line below if you have a faster local drive (e.g., C:\temp)
  // distDir: process.env.NODE_ENV === 'production' ? '.next' : 'C:/temp/welloh-next',
};

export default nextConfig;
