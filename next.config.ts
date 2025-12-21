import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建时忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 将 ali-oss 的可选依赖标记为 external
      config.externals = config.externals || [];
      config.externals.push({
        'proxy-agent': 'commonjs proxy-agent',
      });
    }
    return config;
  },
  // 标记服务器端专用包
  serverExternalPackages: ['ali-oss'],
};

export default nextConfig;
