const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const pages = require('./pages.js')();

// primitive utility to get the latest git commit hash (without git installed)
let commitHash = '';
if (fs.existsSync('.git/HEAD')) {
	const ref = fs.readFileSync('.git/HEAD', 'utf-8').match(/^(?:ref: )?(.*)/)[1];
	commitHash = fs.existsSync(`.git/${ref}`) ? fs.readFileSync(`.git/${ref}`, 'utf-8').trim() : ref;
}

// this will hold language specific values
const messages = {};
for (const file of fs.readdirSync('messages')) {
	if (file.endsWith('.yaml')) {
		messages[path.basename(file, path.extname(file))] =
			yaml.load(fs.readFileSync(`messages/${file}`, 'utf-8'));
	}
}

const getUrl = page =>
	page?.url?.concat?.('.html') ??
	page?.header?.path
		?.replace?.(/\\/g, '/')
		.substring(0, page.header.path.length - path.extname(page.header.path).length)
		.concat('.html') ??
	''; // fallback to empty string

// converts twig internal 'Map' types to plain object
const replacer = (key, value) => {
	if (!Array.isArray(value) && typeof value?.entries === 'function') {
		return Object.fromEntries(value.entries());
	}
	return value;
};

// makes an url for the provided page as the twig-writer default outFile() would do.
const urlFromContext = context => getUrl(replacer(null, context));

// pre-process navigation data
const navigation = [];
for (const page of pages) {
	navigation.push({
		text: page.title || page.header.basename,
		url: getUrl(page)
	});
}

module.exports = {
	getUrl,
	globals: {
		...yaml.load(fs.readFileSync('globals.yaml', 'utf-8')),
		navigation,
		commitHash,
	},
	filters: {
		json: [x => JSON.stringify(x, replacer, 4), { is_safe: ['html'] }],
		yaml: [x => yaml.dump(x, { replacer }), { is_safe: ['html'] }],
	},
	functions: {
		getBase: [ // USAGE: {{ getBase() }}
			context => path.relative(path.dirname(urlFromContext(context)), '.')
				.replace(/\\/g, '/'),
			{ needs_context: true }
		],
		getUrl: [ // USAGE: {{ getUrl() }} or {{ getUrl(_context) }}
			(context, userContext) => {
				const url = urlFromContext(userContext ?? context);
				return url.substring(0, url.length - path.extname(url).length);
			},
			{ needs_context: true }
		],
		T: [ // USAGE: {{ T().prop }} or {{ T(lang).prop }} or {{ T().prop ?? 'default text' }}
			(context, lang) => messages[lang ?? context.get('lang') ?? 'en'],
			{ needs_context: true }
		],
	},
};
