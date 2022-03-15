const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const yaml = require('js-yaml');

// git utility to add git commit hash and working dir to build globals
const git = (...args) => childProcess.spawnSync('git', args)?.stdout?.toString?.()?.trim?.() ?? '';
const getGitCommitHash = () => git('rev-parse', 'HEAD');
const getGitBaseDir = () => git('rev-parse', '--show-toplevel');
const isGitInstalled = git('--help').trim().startsWith('usage:');
const isGitProject = !getGitCommitHash().trim().startsWith('fatal:');

// used by custom json/yaml filters
// converts twig internal 'Map' types to plain object
const replacer = (key, value) => {
	if (!Array.isArray(value) && typeof value?.entries === 'function') {
		return Object.fromEntries(value.entries());
	}
	return value;
};

// makes an url for the provided page as the twig-writer default outFile() would do.
const urlFromContext = context => {
	const page = replacer(null, context); // converts twig context to plain object using the json/yaml replacer
	return page?.output?.path
		?? page?.output?.url?.concat?.('.html')
		?? page?.header?.path?.replace?.(/\.[^.]+$/g, '.html');
};

// usually this should be at the from.module section of the config
// we moved it here to preprocess (navigation) data before the rendering starts
const pages = [...require('@static-pages/markdown-reader').default({})];

// prepares navigation from page data
const navigation = [];
for (const page of pages) {
	navigation.push({
		text: page.title || page.header.basename,
		url: urlFromContext(page)
	});
}

// this will hold translations for our custom trans filter
const translations = {};

module.exports = {
	pages: () => pages, // we use this in the configuration
	controller: d => {
		console.log('rendering', d?.header?.path);

		// generate breadcrumbs
		d.breadcrumbs = urlFromContext(d).split('/');
		d.breadcrumbs.pop(); // remove file name
		d.breadcrumbs.push(d.title || d.header.basename); // add title
		d.breadcrumbs.unshift('Home'); // add Home as the first item

		return d;
	},
	globals: {
		...yaml.load(fs.readFileSync(path.resolve(__dirname, 'globals.yaml'), 'utf-8')),
		navigation,
		...(isGitInstalled && isGitProject ? {
			git: {
				commit: {
					hash: getGitCommitHash(),
				},
				dir: getGitBaseDir(),
			}
		} : undefined),
	},
	filters: {
		json: [
			x => JSON.stringify(x, replacer, 4),
			{ is_safe: ['html'] }
		],
		yaml: [
			x => yaml.dump(x, { replacer }),
			{ is_safe: ['html'] }
		],
		trans: [
			(context, message) => {
				const langCode = context.get('lang') ?? 'en';
				if (!translations[langCode]) {
					const transFile = path.resolve(__dirname, 'messages', langCode + '.yaml');
					if (fs.existsSync(transFile)) {
						translations[langCode] = yaml.load(fs.readFileSync(transFile, 'utf-8'));
					} else {
						translations[langCode] = {};
					}
				}
				return translations[langCode][message] ?? message;
			},
			{ needs_context: true }
		],
	},
	functions: {
		url: [
			(context, url) => path.normalize(
				path.join(
					path.relative(path.dirname(urlFromContext(context)), path.dirname(url)),
					path.basename(url)
				)
			).replace(/\\/g, '/'),
			{ needs_context: true }
		],
	},
};
