import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline"
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api-cache",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60
        }
      }
    }
  ]
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default withPWA(nextConfig);
