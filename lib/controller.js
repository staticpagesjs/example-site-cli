const { getUrl } = require('./twig-utils');

module.exports = function (d) {
	console.log('Render', d?.header?.path);

	// generate some breadcrumbs
	d.breadcrumbs = ['Home', ...getUrl(d).split('/')];
	// replace filename (last item) with title
	d.breadcrumbs.splice(-1, 1, d.title || d.header.basename);

	// when returning undefined the content is not rendered.
	// it is possible to return an array, in that case multiple pages are rendered.
	return d;
};
