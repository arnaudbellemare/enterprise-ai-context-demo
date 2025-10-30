/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Do not block builds on ESLint errors in CI; lint runs separately
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['redis', 'onnxruntime-node'],
  },
  webpack: (config, { isServer }) => {
    // Externalize redis and ONNX for server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'redis', 'onnxruntime-node'];
    }
    
    // Ignore redis on client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        redis: false,
        'onnxruntime-node': false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
