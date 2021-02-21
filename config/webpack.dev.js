const webpack = require('webpack')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

const imgLoader = {
   loader: 'url-loader',
   options: {
      limit: 8000,
      name: 'static/media/[hash]-[name].[ext]'
   }
}

module.exports = merge(
   {
      mode: 'development',
      devtool: 'cheap-module-source-map',
      output: {
         filename: 'static/js/bundle-[hash].js'
      },
      module: {
         rules: [
            { test: /\.global\.(css|scss|sass)$/, use: ['style-loader'] },
            { test: /^((?!\.global).)*\.(css|scss|sass)$/, use: ['style-loader'] },
            { test: /\.(png|jp(e*)g|svg|ico|gif)$/, use: [imgLoader] }
         ]
      },
      devServer: {
         host: '0.0.0.0',
         port: 8080,
         hot: true,
         historyApiFallback: true,
         disableHostCheck: true,
      },
      optimization: {
         moduleIds: 'named'
      },
      resolve: {
         alias: {
            'react-dom': '@hot-loader/react-dom'
         }
      }
   },
   common
)
