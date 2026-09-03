import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required by the Dockerfile: the runtime image ships only .next/standalone.
  output: 'standalone',
  // #region feature:media
  images: {
    // Every image is a Payload upload, served through Payload's own
    // /api/media/file/** route (that stays true with the S3 adapter enabled — it
    // streams from the bucket through the same route).
    //
    // Note this is an allow-list, not an addition: declaring `localPatterns` at
    // all restricts next/image to the paths listed here, so anything added under
    // /public later needs its own entry or the page 500s.
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  // #endregion feature:media
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
