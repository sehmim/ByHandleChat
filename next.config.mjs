/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Configure turbopack (required for Next.js 16+)
  turbopack: {
    rules: {
      // Add support for importing CSS as inline strings (for widget)
      '*.css?inline': {
        loaders: ['raw-loader'],
      },
    },
  },
}

export default nextConfig
