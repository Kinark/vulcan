const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
   template: './public/index.html',
   filename: 'index.html',
   inject: 'body'
})

const fontLoader = {
   loader: 'url-loader',
   options: {
      name: 'static/fonts/[name].[ext]'
   }
}

const postCssLoader = {
   loader: 'postcss-loader',
   options: {
      postcssOptions: {
         path: './config/postcss.config.js'
      }
   }
}

const cssLoader = {
   loader: 'css-loader',
   options: {
      importLoaders: 3,
      localIdentName: '[local]_[hash:base64:5]',
      modules: true
   }
}

const scssLoader = {
   loader: 'sass-loader',
   options: {
      sourceMap: true
   }
}

module.exports = {
   entry: path.resolve(__dirname, '../src/index.js'),
   output: {
      publicPath: '/'
   },
   module: {
      rules: [
         { test: /\.global\.(css|scss|sass)$/, use: ['css-loader', postCssLoader, 'resolve-url-loader', scssLoader] },
         { test: /^((?!\.global).)*\.(css|scss|sass)$/, use: [cssLoader, postCssLoader, 'resolve-url-loader', scssLoader] },
         { test: /\.(js|jsx)$/, use: [{ loader: 'babel-loader', options: { cacheDirectory: true } }], exclude: /node_modules/ },
         { test: /\.(otf|ttf|eot|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, use: [fontLoader] }
      ]
   },
   plugins: [HtmlWebpackPluginConfig],
   resolve: {
      alias: {
         '~': path.resolve(__dirname, '../src')
      }
   }
}
