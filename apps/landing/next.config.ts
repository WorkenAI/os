import path from 'node:path'
import type { NextConfig } from 'next'
import { withWorkflow } from '@workflow/next'

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
}

export default withWorkflow(config)
