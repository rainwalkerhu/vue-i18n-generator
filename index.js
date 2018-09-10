require('colors');
const path = require('path');
const fs = require('fs');
let i18nFile = path.join(process.cwd(), 'zh-cn.js');
let messages;
let rootPath;
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
const generateVueFile = file => {
    let processFile = path.relative(process.cwd(), file);
    console.log(`➤ ${processFile.yellow}`.blue);
    let key = `${path.relative(rootPath, file).replace(/[\\/\\\\-]/g, '_').replace(/\..*$/, '')}_`;
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
                //对于 muscache 中部分的替换
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
                    //对于属性中普通文本的替换
                    result = `:${prev}$t("${currentKey}")${after}`;
                } else if (prev.match(/^\w+="$/)) {
                    //对于属性中普通文本的替换
                    result = `:${prev}$t('${currentKey}')${after}`;
                } else if (prev === '"' || prev === '\'') {
                    //对于属性中参数形式中的替换
                    result = `$t(${prev}${currentKey}${after})`;
                } else {
                    //对于tag标签中的普通文本替换
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
                //对于普通字符串的替换
                currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
                result = `this.$t('${currentKey}')`;
            } else {
                //对于 `` 拼接字符串的替换
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

const generateJsFile = (file) => {
    let processFile = path.relative(process.cwd(), file);
    console.log(`➤ ${processFile.yellow}`.blue);
    let key = `${path.relative(rootPath, file).replace(/[\\/\\\\-]/g, '_').replace(/\..*$/, '')}_`;
    let index = 1;
    let content = fs.readFileSync(file, 'utf8');
    let messagesHash = {};
    //判断是否已经引入了 Vue， 若没有引入，则在文件头部引入
    let vueMatch = content.match(/(import[\s\t]+([^\s\t]+)[\s\t]+from[\s\t]+'vue'[\s\t]*;?)|((let|var|const)[\s\t]+([^\s\t]+)[\s\t]+\=[\s\t]+require\('vue'\)[\s\t]*;?)/g);
    let vueModule = 'Vue';
    if (!vueMatch) {
        content = `import Vue from 'vue';\n${content}`;
    } else {
        vueMatch[0].replace(/^[^\s\t]+[\s\t]+([^\s\t]+)/g, (match, $1) => {
            vueModule = $1;
        });
    }
    let imports = content.match(/from[\s\t]+['"][^'"]+['"][\s\t]*;?/gm);
    let lastImport = imports[imports.length - 1];
    //判断是否已经做过绑定 $t 的绑定，若没有，则自动绑定 $t
    if (!content.match(/const[\s\t]+\$t[\s\t]+=[\s\t]+_i18n_vue.\$t.bind(_i18n_vue)[\s\t]*;?/)) {
        content = content.replace(lastImport, $ => {
            return `${$}\nlet _i18n_vue = new ${vueModule}();\nconst $t = _i18n_vue.$t.bind(_i18n_vue);`;
        });
    }
    content = content.replace(/(['"`])([^'"`\n]*[\u4e00-\u9fa5]+[^'"`\n]*)(['"`])/gim, (_, prev, match, after) => {
        match = match.trim();
        let currentKey;
        let result = '';
        if (prev !== '`') {
            //对于普通字符串的替换
            currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
            result = `$t('${currentKey}')`;
        } else {
            //对于 `` 拼接字符串的替换
            let matchIndex = 0;
            let matchArr = [];
            match = match.replace(/(\${)([^{}]+)(})/gim, (_, prev, match) => {
                matchArr.push(match);
                return `{${matchIndex++}}`;
            });
            currentKey = (messagesHash[match] || key + (index++)).toLowerCase();
            if (!matchArr.length) {
                result = `$t('${currentKey}')`;
            } else {
                result = `$t('${currentKey}', [${matchArr.toString()}])`;
            }
        }
        messages[currentKey] = match;
        messagesHash[match] = currentKey;
        return result;
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
            if (['.vue', '.js'].indexOf(path.extname(item).toLowerCase()) > -1) {
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
    rootPath = path.join(process.cwd(), src);
    let files = getAllFiles(rootPath);
    initMessage();
    files.forEach(item => {
        path.extname(item).toLowerCase() === '.vue' ? generateVueFile(item) : generateJsFile(item);
    });
    writeMessage();
};
