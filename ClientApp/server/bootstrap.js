require('ignore-styles');

require('babel-register')({
    ignore: [/(node_modules)/],
    presets: [
        'es2015',
        'react-app'],
    plugins: [
        'dynamic-import-node',
        'react-loadable/babel']
});

const prerenderer = require('./index').default;

module.exports.prerenderer = prerenderer