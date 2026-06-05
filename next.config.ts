import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    // Prevent Next.js from mis-detecting the workspace root when
    // a parent directory also contains a package-lock.json
    root: __dirname,
  },
}

export default nextConfig
