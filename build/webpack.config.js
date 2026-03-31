const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');

module.exports = (_env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    target: 'electron-renderer',
    entry: path.resolve(srcDir, 'panel', 'index.tsx'),
    output: {
      path: path.resolve(rootDir, 'dist'),
      filename: isProd ? 'panel.[contenthash:8].js' : 'panel.js',
      clean: true,
    },
    devtool: isProd ? false : 'source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        '@panel': path.resolve(srcDir, 'panel'),
        '@bridge': path.resolve(srcDir, 'bridge'),
        '@security': path.resolve(srcDir, 'security'),
        '@registry': path.resolve(srcDir, 'registry'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(srcDir, 'panel', 'index.html'),
        filename: 'index.html',
        inject: 'body',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(srcDir, 'panel', 'CSInterface.js'),
            to: 'CSInterface.js',
          },
        ],
      }),
    ],
    stats: 'minimal',
    infrastructureLogging: {
      level: 'warn',
    },
  };
};
