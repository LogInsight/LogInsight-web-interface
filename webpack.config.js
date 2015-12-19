// webpack.config.js
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
const Clean = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');

var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'src');
var BUILD_PATH = path.resolve(ROOT_PATH, 'build');
var TARGET = process.env.npm_lifecycle_event;
process.env.BABEL_ENV = TARGET;

var babelQuery = {
		plugins : [],
		extra: {}
};

// only extract po files if we need to
if (process.env.GRAYLOG_EXTRACT_TRANSLATIONS === '1') {
  babelQuery.plugins.push('babel-gettext-extractor');
  babelQuery.extra.gettext = {
    fileName: 'po/javascript.po',
    baseDirectory: path.join(__dirname, 'src'),
    functionNames: {
      gettext: ['msgid'],
      ngettext: ['msgid', 'msgid_plural', 'count'],
      gettextComponentTemplate: ['msgid'],
      t: ['msgid'],
      tn: ['msgid', 'msgid_plural', 'count'],
      tct: ['msgid']
    },
  };
}

const webpackConfig = {
  context: path.join(__dirname, APP_PATH), 
  entry: {
    app: APP_PATH,
    config: 'config.js',
	'translations': ['translations']
  },
  output: {
    path: BUILD_PATH,
    vendor: ['react', 'react-router', 'react-bootstrap'],
    filename: '[name].[hash].js',
    publicPath: '/',
	libraryTarget: 'var',
	library: 'exports', 
  },
  module: {
    preLoaders: [
      // { test: /\.js(x)?$/, loader: 'eslint-loader', exclude: /node_modules|public\/javascripts/ }
    ],
    loaders: [

      { test: /\.jsx?$/, loader: 'babel-loader', exclude: /vendor|node_modules|\.node_cache/, query: babelQuery },
      //{ test: /\.js(x)?$/, loaders: ['react-hot', 'babel-loader'], exclude: /node_modules| \.node_cache/ },
      { test: /\.po$/,loader: 'po-catalog-loader',query: { referenceExtensions: ['.js', '.jsx'], domain: 'graylog_domain' }},
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.ts$/, loader: 'babel-loader!ts-loader', exclude: /node_modules|\.node_cache/ },
      { test: /\.(woff(2)?|svg|eot|ttf|gif|jpg)(\?.+)?$/, loader: 'file-loader?name=' + '[name].[ext]' },
      { test: /\.png$/, loader: 'url-loader' },
      { test: /\.less$/, loader: 'style!css!less' },
      { test: /\.css$/, loader: 'style!css' },
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
  /*devtool: 'eval',*/
  plugins: [
    new Clean([BUILD_PATH]),
    new HtmlWebpackPlugin({title: 'Loginsight', favicon: 'public/images/favicon.ico'}),
    new HtmlWebpackPlugin({filename: 'module.json', template: 'templates/module.json.template'}),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'root.jQuery': 'jquery',
    }),
    new ExtractTextPlugin('[name].css')
  ]
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
	new webpack.optimize.DedupePlugin(),
  ],
};

module.exports = webpackConfig

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
