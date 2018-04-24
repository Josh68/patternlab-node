'use strict';

const path = require('path');
const chokidar = require('chokidar');

const logger = require('./log');

let copyFile = require('./copyFile'); // eslint-disable-line prefer-const

function onWatchTripped(p, assetBase, basePath, dir, copyOptions) {
  const subPath = p.replace(assetBase, '');
  const destination = path.resolve(basePath, dir.public + '/' + subPath);
  copyFile(p, destination, copyOptions);
}

const watchAssets = (
  patternlab,
  basePath,
  dir,
  key,
  copyOptions,
  watchOnce
) => {
  const assetBase = path.resolve(basePath, dir.source);
  const assetsToIgnore = patternlab.config.transformedAssetTypes.join('|');
  logger.debug(`Pattern Lab is watching ${assetBase} for changes`);

  if (patternlab.watchers[key]) {
    patternlab.watchers[key].close();
  }
  const assetWatcher = chokidar.watch(assetBase, {
    // *ignored* combines file types that the wrapper is watching, passed to pl config
    // regex string escapes backslashes for JS
    // second part of regex is holdover from existing ignore regex for '/index.html' and other
    // files meant to be ignored, not based on file type
    ignored: new RegExp(`(?:(?:.*\\.(?:${assetsToIgnore})$)|(?:(^|[\\/\\\\])\\..))`, 'i'),
    //ignored: /(^|[\/\\])\../, //old version
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
    persistent: !watchOnce,
  });

  //watch for changes and copy
  assetWatcher
    .on('add', p => {
      onWatchTripped(p, assetBase, basePath, dir, copyOptions);
    })
    .on('change', p => {
      onWatchTripped(p, assetBase, basePath, dir, copyOptions);
    });

  patternlab.watchers[key] = assetWatcher;
};

module.exports = watchAssets;
