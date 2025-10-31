/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Do not block builds on ESLint errors in CI; lint runs separately
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['redis', 'onnxruntime-node', '@tensorflow/tfjs-node'],
  },
  webpack: (config, { isServer }) => {
    // Externalize server-only packages for server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'redis', 'onnxruntime-node', '@tensorflow/tfjs-node'];
    }
    
    // Ignore server-only packages on client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        redis: false,
        'onnxruntime-node': false,
        '@tensorflow/tfjs-node': false,
      };
      
      // Ignore problematic node-pre-gyp dependencies
      config.resolve.alias = {
        ...config.resolve.alias,
        'mock-aws-s3': false,
        'aws-sdk': false,
        'nock': false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
