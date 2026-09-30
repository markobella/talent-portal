import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [
      { pathname: "/api/avatars/**" },
      { pathname: "/api/public/avatars/**" },
      { pathname: "/api/gallery/**" },
      { pathname: "/api/public/gallery/**" },
      { pathname: "/api/setcards/**" },
      { pathname: "/api/public/setcards/**" },
      { pathname: "/api/admin/talent/**/avatar/**" },
      { pathname: "/uploads/**" },
      { pathname: "/**" },
    ],
    remotePatterns: [],
  },
};

export default nextConfig;
