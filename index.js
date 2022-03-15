const staticPages = require('@static-pages/core').default;
const mdReader = require('@static-pages/markdown-reader').default;

staticPages([{

  from: mdReader({
    cwd: 'pages',
    pattern: '**/*.md',
    incremental: true,
  }),

  controller: d => {
    console.log(d);
    return d;
  },

  to: () => null,

}]).catch(console.error);
