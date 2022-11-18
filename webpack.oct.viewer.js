const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  watch: true,
  entry: {
    seed: './src/seed.js',
    modeldata: './src/modelsMin.js',
    sdf: './src/octree/sdf.js',
    buildmodel: './src/repo.js',
    glslloader: './src/octree/glslloader.js',
    oct: './src/octree/oct.js',
    viewer: './src/octree/viewer.js',
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
      filename: 'viewer.html',
    }),
  ],
  performance: {
    hints: false,
  }, // hides the "huge file" warnings which i assume won't be relevant
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public'),
    clean: false,
    publicPath: '',
  },
};
