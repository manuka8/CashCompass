const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { resolver } = config;

config.resolver.sourceExts = [...new Set(['ts', 'tsx', ...resolver.sourceExts, 'js', 'jsx', 'json', 'cjs', 'mjs'])];

module.exports = config;
