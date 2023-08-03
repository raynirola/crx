import webpack from 'webpack'
import { resolve } from 'path'
import Copy from 'copy-webpack-plugin'

var extensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2']

/**
 * Webpack Configuration
 * @type {import('webpack').Configuration}
 */
var config = {
  entry: {
    popup: resolve('src', 'pages', 'popup.tsx'),
    sw: resolve('src', 'workers', 'sw.ts'),
    content: resolve('src', 'scripts', 'content.tsx'),
  },
  output: {
    filename: '[name].js',
    path: resolve('build'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: new RegExp('.(' + extensions.join('|') + ')$'),
        type: 'asset/resource',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(ts|tsx)$/,
        use: [{ loader: 'source-map-loader' }, { loader: 'ts-loader' }],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: { '@': resolve('src') },
    extensions: extensions.map(ext => '.' + ext).concat(['.js', '.jsx', '.ts', '.tsx', '.css', ',json']),
  },
  plugins: [
    new webpack.ProgressPlugin({ activeModules: false, entries: false, dependencies: false, modules: false }),
    new Copy({
      patterns: [
        { from: 'src/manifest.json', to: resolve('build'), force: true, transform: trasformManifest },
        { from: 'src/pages/popup.html', to: resolve('build', 'popup.html'), force: true },
        { from: 'src/assets', to: resolve('build', 'assets'), force: true },
      ],
    }),
  ],
  infrastructureLogging: { level: 'info' },
  mode: 'development',
  watch: true,
  watchOptions: { ignored: ['**/node_modules', '**/build'] },
  devtool: 'cheap-module-source-map',
  optimization: { minimize: false },
}

/**
 * Remove $schema from manifest.json
 * @param {Buffer} content
 * @returns {string}
 */
function trasformManifest(content) {
  const json = JSON.parse(content.toString())
  delete json.$schema
  return JSON.stringify(json, null, 2)
}

webpack(config, webpackCallback)

function webpackCallback(err, stats) {
  if (err || stats.hasErrors()) {
    const { errors } = stats.toJson({ errors: true })
    console.log(`\x1b[31m%s\x1b[0m`, `\n\nBuild failed with ${errors.length} error${errors.length > 1 ? 's' : ''}:\n`)
    console.dir({ errors: errors.length ? errors.map(formatStat) : null })
    process.env.NODE_ENV === 'development' && console.log('\x1b[1m\x1b[34m%s\x1b[0m', 'Waiting for file changes...')
    return
  }

  const picked = stats.toJson({
    all: false,
    warnings: true,
    assets: true,
    entrypoints: true,
  })

  const { warnings, assets, entrypoints } = picked

  const raw = {
    warnings: warnings.length && process.env.NODE_ENV === 'development' ? warnings.map(formatStat) : null,
    entry: Object.values(entrypoints)
      .map(entry => ({ [entry.name]: `${(entry.assetsSize / 1024 / 1024).toFixed(3)} MB` }))
      .reduce((acc, curr) => ({ ...acc, ...curr })),
    files: {
      total: `${assets.length} files`,
      size: `${(assets.reduce((acc, curr) => acc + curr.size, 0) / 1024 / 1024).toFixed(3)} MB`,
    },
  }

  const filtered = Object.keys(raw).reduce((acc, curr) => {
    if (raw[curr]) acc[curr] = raw[curr]
    return acc
  }, {})

  console.log(
    '\x1b[1m\x1b[32m%s\x1b[0m',
    `\n\nBuild completed in ${stats.endTime - stats.startTime}ms || ${new Date().toLocaleTimeString()}}`
  )
  console.dir(filtered, { depth: null, colors: true })

  process.env.NODE_ENV === 'development' && console.log('\x1b[1m\x1b[34m%s\x1b[0m', 'Waiting for file changes...')
}

function formatStat(stat) {
  return {
    message: stat.message?.split('\n')[0],
    module: stat.moduleName?.split('/').pop(),
    file: stat.moduleName,
  }
}
