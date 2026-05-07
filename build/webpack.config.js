const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');
const packageJson = require(path.resolve(rootDir, 'package.json'));

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
      new webpack.DefinePlugin({
        __HOPEFLOW_DEV_MODE__: JSON.stringify(!isProd),
        __HOPEFLOW_VERSION__: JSON.stringify(packageJson.version),
      }),
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
          {
            from: path.resolve(srcDir, 'panel', 'retrace'),
            to: 'retrace',
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
