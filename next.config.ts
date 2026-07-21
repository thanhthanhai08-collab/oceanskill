import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-unrar-js"],
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "**.supabase.co",
      pathname: "/storage/v1/object/public/blog-assets/**",
    }],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
