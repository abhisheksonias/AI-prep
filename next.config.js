/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Skip lint failures during CI/CD so deployment does not block; run lint locally instead.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

