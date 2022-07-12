// usually this should be at the 'from' section of the config
// we moved it here to pre-process navigation data before the rendering
const pages = [...require('@static-pages/markdown-reader').default()];

module.exports = () => pages;
