const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      background: './src/background/background.js',
      content: './src/content/content.js',
      popup: './src/popup/popup.js',
      options: './src/options/options.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name]/[name].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]'
          }
        }
      ]
    },
    plugins: [
      new Dotenv(),
      new CopyPlugin({
        patterns: [
          { 
            from: 'manifest.json', 
            to: '[name][ext]',
            transform(content) {
              // Update paths in the manifest to match the output structure
              const manifest = JSON.parse(content.toString());
              
              // Update paths as needed
              if (manifest.action && manifest.action.default_popup) {
                manifest.action.default_popup = 'popup/popup.html';
              }
              
              if (manifest.background && manifest.background.service_worker) {
                manifest.background.service_worker = 'background/background.js';
              }
              
              if (manifest.content_scripts) {
                manifest.content_scripts = manifest.content_scripts.map(script => {
                  if (script.js) {
                    script.js = script.js.map(js => js.replace('src/', ''));
                  }
                  return script;
                });
              }
              
              if (manifest.options_page) {
                manifest.options_page = 'options/options.html';
              }
              
              // Update icon paths
              if (manifest.icons) {
                Object.keys(manifest.icons).forEach(size => {
                  manifest.icons[size] = manifest.icons[size].replace('src/', '');
                });
              }
              
              if (manifest.action && manifest.action.default_icon) {
                Object.keys(manifest.action.default_icon).forEach(size => {
                  manifest.action.default_icon[size] = manifest.action.default_icon[size].replace('src/', '');
                });
              }
              
              return JSON.stringify(manifest, null, 2);
            }
          },
          { from: 'src/assets', to: 'assets' },
          { from: 'src/metaprompt.txt', to: 'metaprompt.txt' }
        ]
      }),
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup/popup.html',
        chunks: ['popup']
      }),
      new HtmlWebpackPlugin({
        template: './src/options/options.html',
        filename: 'options/options.html',
        chunks: ['options']
      }),
      new MiniCssExtractPlugin({
        filename: '[name]/[name].css'
      }),
      ...(isProduction ? [
        new ZipPlugin({
          filename: 'chrome-extension.zip'
        })
      ] : [])
    ],
    resolve: {
      extensions: ['.js']
    },
    devtool: isProduction ? false : 'source-map'
  };
};
