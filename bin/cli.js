#!/usr/bin/env node
require('colors');
const packageInfo = require('../package.json');
const program = require('commander');
const command = require('../index');
const showVersion = () => {
	console.log('');
	console.log('i18n version: ' + packageInfo.version);
	console.log('');
};
const showHelp = () => {
	console.log('Example:');
	console.log('');
	console.log(' $ i18n generate');
	console.log('');
};

program.version(packageInfo.version, '-v, --version');
program.command('generate [src]').description('对src目录下的vue文件进行国际化替换生成').action((src = 'src') => {
	command.generate(src);
});

if (process.argv.length === 2) {
	showVersion();
	showHelp();
}

program.parse(process.argv);
