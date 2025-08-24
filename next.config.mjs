/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // 添加Stylus支持
    config.module.rules.push({
      test: /\.module\.styl$/,
      use: [
        {
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[name]__[local]___[hash:base64:5]',
            },
            importLoaders: 1,
            esModule: false,
          },
        },
        'stylus-loader',
      ],
    })
    
    return config
  },
}

export default nextConfig
