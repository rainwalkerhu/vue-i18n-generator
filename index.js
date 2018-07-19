require('colors');
const path = require('path');
const fs = require('fs');
let i18nFile = path.join(process.cwd(), 'zh-cn.js');
let messages;
/**
 * 初始化国际化的消息对象
 */
const initMessage = () => {
    if (fs.existsSync(i18nFile)) {
        try {
            messages = require(i18nFile);
        } catch (e) {
        }
    }
    if (!messages || !Object.keys(messages).length) {
        messages = {};
    }
};
/**
 * 写入国际化消息文件
 */
const writeMessage = () => {
    fs.writeFileSync(i18nFile, `module.exports = ${JSON.stringify(messages)}`, 'utf8');
};
/**
 * 替换Vue文件中的需要国际化的部分
 * @param file
 */
const generateFile = file => {
    let processFile = path.relative(process.cwd(), file);
    console.log(`➤ ${processFile.yellow}`.blue);
    let key = `${path.dirname(file).replace(/^.*[\\/]/gim, '')}_${path.basename(file).replace(/-/gim, '_').replace(/\..*$/, '')}_`;
    let index = 1;
    let content = fs.readFileSync(file, 'utf8');
    let messagesHash = {};
    // 替换template中的部分
    content = content.replace(/<template(.|\n)*template>/gim, match => {
        return match.replace(/(\w+='|\w+="|>|'|")([^'"<>]*[\u4e00-\u9fa5]+[^'"<>]*)(['"<])/gim, (_, prev, match, after) => {
            match = match.trim();
            let result = '';
            let currentKey;
            if (match.match(/{{[^{}]+}}/)) {
                let matchIndex = 0;
                let matchArr = [];
                match = match.replace(/{{([^{}]+)}}/gim, (_, match) => {
                    matchArr.push(match);
                    return `{${matchIndex++}}`;
                });
                currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
                if (!matchArr.length) {
                    result = `${prev}{{$t('${currentKey}')}}${after}`;
                } else {
                    result = `${prev}{{$t('${currentKey}', [${matchArr.toString()}])}}${after}`;
                }
            } else {
                currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
                if (prev.match(/^\w+='$/)) {
                    result = `:${prev}$t("${currentKey}")${after}`;
                } else if (prev.match(/^\w+="$/)) {
                    result = `:${prev}$t('${currentKey}')${after}`;
                } else if (prev === '"' || prev === '\'') {
                    result = `$t(${prev}${currentKey}${after})`;
                } else {
                    result = `${prev}{{$t('${currentKey}')}}${after}`;
                }
            }
            messages[currentKey] = match;
            messagesHash[match] = currentKey;
            return result;
        });
    });
    // 替换script中的部分
    content = content.replace(/<script(.|\n)*script>/gim, match => {
        return match.replace(/(['"`])([^'"`\n]*[\u4e00-\u9fa5]+[^'"`\n]*)(['"`])/gim, (_, prev, match, after) => {
            match = match.trim();
            let currentKey;
            let result = '';
            if (prev !== '`') {
                currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
                result = `this.$t('${currentKey}')`;
            } else {
                let matchIndex = 0;
                let matchArr = [];
                match = match.replace(/(\${)([^{}]+)(})/gim, (_, prev, match) => {
                    matchArr.push(match);
                    return `{${matchIndex++}}`;
                });
                currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
                if (!matchArr.length) {
                    result = `this.$t('${currentKey}')`;
                } else {
                    result = `this.$t('${currentKey}', [${matchArr.toString()}])`;
                }
            }
            messages[currentKey] = match;
            messagesHash[match] = currentKey;
            return result;
        });
    });
    Object.keys(messagesHash).length && fs.writeFileSync(file, content, 'utf-8');
    console.log(`✔ ${processFile.yellow}`.green);
};
/**
 * 获取所有满足需求的文件
 * @param dir
 * @returns {Array}
 */
const getAllFiles = (dir) => {
    let results = [];
    fs.readdirSync(dir).forEach(item => {
        item = path.join(dir, item);
        if (fs.lstatSync(item).isDirectory()) {
            results.push(...getAllFiles(item));
        } else {
            if (path.extname(item).toLowerCase() === '.vue') {
                results.push(item);
            }
        }
    });
    return results;
};
/**
 * 入口
 * @param src
 */
module.exports.generate = (src) => {
    src = path.join(process.cwd(), src);
    let files = getAllFiles(src);
    initMessage();
    files.forEach(item => {
        generateFile(item);
    });
    writeMessage();
};
