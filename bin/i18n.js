#!/usr/bin/env node
require('colors');
const packageInfo = require('../package.json');
const program = require('commander');
const commandFile = require('../index');

program.version(packageInfo.version, '-v, --version');
program.command('generate [src]')
    .description('对src目录下的vue文件进行国际化替换生成, 默认src为执行目录下的src目录')
    .option('-k, --key <key>', '自定义key前缀，默认为相对执行目录的文件路径')
    .option('-s, --single', '是否为单文件index序列，默认为全局序列，当自定义key之后，此设置无效')
    .action((src = 'src', {key, single}) => {
        let options = {key, single};
        commandFile.generate(src, options);
    });
program.on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
});
if (process.argv.length === 2) {
    program.help();
}

program.parse(process.argv);
