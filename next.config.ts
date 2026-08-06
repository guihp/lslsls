import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Avatars upload straight to Supabase Storage; this only guards other
      // form actions from the 1MB default.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
