const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  watch: false,
  entry: {
    seed: './src/seed.js',
    modeldata: './src/modelsMin.js',
    sdf: './src/octree/sdf.js',
    buildmodel: './src/repo.js',
    glslloader: './src/octree/glslloader.js',
    oct: './src/octree/oct.js',
    viewer: './src/octree/viewer.js',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
        terserOptions: {
          mangle: true, // Note `mangle.properties` is `false` by default.
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
  // devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: [
          {
            loader: 'webpack-glsl-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Tickle Beach',
      template: 'src/octree/viewer.html',
      inject: 'body',
      filename: 'index.html',
    }),
    new HtmlInlineScriptPlugin(),
  ],
  performance: {
    hints: false,
  }, // hides the "huge file" warnings which i assume won't be relevant
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'prod'),
    clean: false,
  },
};
