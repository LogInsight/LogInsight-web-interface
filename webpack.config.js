// webpack.config.js
const webpack = require('webpack');
const path = require('path');
const Clean = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');

const ROOT_PATH = path.resolve(__dirname);
const APP_PATH = path.resolve(ROOT_PATH, 'src');
const BUILD_PATH = path.resolve(ROOT_PATH, 'build');
const TARGET = process.env.npm_lifecycle_event;
process.env.BABEL_ENV = TARGET;

const webpackConfig = {
  entry: {
    app: APP_PATH,
    config: 'config.js',
  },
  output: {
    path: BUILD_PATH,
    vendor: ['react', 'react-router', 'react-bootstrap'],
    filename: '[name].[hash].js',
   // publicPath: 'http://localhost:9000/_static/sentry/dist/graylog/',
    publicPath: '/',

  },
  module: {
    preLoaders: [
      // { test: /\.js(x)?$/, loader: 'eslint-loader', exclude: /node_modules|public\/javascripts/ }
    ],
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.js(x)?$/, loaders: ['react-hot', 'babel-loader'], exclude: /node_modules|\.node_cache/ },
      { test: /\.ts$/, loader: 'babel-loader!ts-loader', exclude: /node_modules|\.node_cache/ },
      { test: /\.(woff(2)?|svg|eot|ttf|gif|jpg)(\?.+)?$/, loader: 'file-loader' },
      { test: /\.png$/, loader: 'url-loader' },
      { test: /\.less$/, loader: 'style!css!less' },
      { test: /\.css$/, loader: 'style!css' },
      {test: /\.po$/,loader: 'po-catalog-loader',query: { referenceExtensions: ['.js', '.jsx'], domain: 'graylog' }},
    ],
  },
  resolve: {
    // you can now require('file') instead of require('file.coffee')
    extensions: ['', '.js', '.json', '.jsx', '.ts'],
    modulesDirectories: ['src', 'node_modules', 'public'],
  },
  eslint: {
    configFile: '.eslintrc',
  },
  devtool: 'eval',
  plugins: [
    new Clean([BUILD_PATH]),
    new HtmlWebpackPlugin({title: 'Graylog', favicon: 'public/images/favicon.png'}),
    new HtmlWebpackPlugin({filename: 'module.json', template: 'templates/module.json.template'}),
  ],
};

const commonConfigs = {
  module: {
    loaders: [
      { test: /pages\/.+\.jsx$/, loader: 'react-proxy', exclude: /node_modules|\.node_cache/ },
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
    new webpack.optimize.CommonsChunkPlugin('config', 'config.js', ['config']),
  ],
};

if (TARGET === 'start') {
  console.log('Running in development mode');
  module.exports = merge(webpackConfig, {
    devtool: 'eval',
    devServer: {
      historyApiFallback: true,
      hot: true,
      inline: true,
      progress: true,
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
    ],
  });
}

if (TARGET === 'build') {
  console.log('Running in production mode');
  module.exports = merge(webpackConfig, {
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        sourceMap: false,
        compress: {
          warnings: false,
        },
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
    ],
  });
}

if (TARGET === 'test') {
  console.log('Running test/ci mode');
  module.exports = merge(webpackConfig, {
    module: {
      preLoaders: [
        { test: /\.js(x)?$/, loader: 'eslint-loader', exclude: /node_modules|public\/javascripts/ }
      ],
    },
  });
}

if (TARGET === 'start' || TARGET === 'build') {
  module.exports = merge(commonConfigs, module.exports);
}

if (Object.keys(module.exports).length === 0) {
  console.log('Running in default mode');
  module.exports = webpackConfig;
}
