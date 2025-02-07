// 导入fs模块，用于读写文件
const fs = require('fs');
const path = require('path');

// 定义一个正则表达式，用于匹配汉字
const chineseRegex = /[\u4e00-\u9fa5，。？！：；“”‘’（）【】《》]+/g;

// 定义一个函数，用于提取汉字串，并生成一个json文件
function extractChineseStrings(file, dirPath) {
  // 读取文件内容
  const content = fs.readFileSync(file, 'utf8');
  // 用一个对象存储汉字串和对应的键值
  const chineseMap = {};
  // 用一个数组存储汉字串
  const chineseArray = [];
  // 遍历文件内容，匹配汉字串
  content.replace(chineseRegex, (match) => {
    // 如果汉字串不在数组中，就添加到数组和对象中
    if (!chineseArray.includes(match)) {
      chineseArray.push(match);
      const relativePath = path.relative(dirPath, file).replace(/\\/g, '.').replace(path.extname(file), '');
      chineseMap[`${prefix}.${relativePath}.${match}`] = match;
    }
  });
  return chineseMap;
}

// 替换template标签下的汉字，并直接修改原文件
function replaceChineseInTemplate(file) {
  // 读取文件内容
  const content = fs.readFileSync(file, 'utf8');
  // 定义一个正则表达式，用于匹配template标签
  const templateRegex = /<template>([\s\S]*)<\/template>/;
  // 定义一个变量，用于存储template标签下的内容
  let templateContent = '';
  // 遍历文件内容，匹配template标签
  content.replace(templateRegex, (match, group) => {
    // 将template标签下的内容赋值给变量
    templateContent = group;
  });
  // 处理所有汉字
  templateContent = templateContent.replace(chineseRegex, (match) => {
    return `$t('${prefix}.${match}')`;
  });
  // 定义一个正则表达式，用于匹配上一步处理后的字符串中，没有被双引号包围的部分
  const noQuoteRegex = /(?<!")(\$t\('.*'\))(?!")/g;
  // 处理其中没有被双引号包围的部分
  templateContent = templateContent.replace(noQuoteRegex, (match) => {
    return `{{ ${match} }}`;
  });
  // 定义一个正则表达式，用于匹配形如 word="$t(' 的字符串
  const wordRegex = /\w+="\$t\('/g;
  // 替换形如 word="$t(' 的字符串，改为 :word="$t(' 的格式
  templateContent = templateContent.replace(wordRegex, (match) => {
    // 获取 word 的部分
    const word = match.split('=')[0];
    // 返回替换后的字符串
    return `:${word}="$t('`;
  });
  // 替换原文件内容
  const newContent = content.replace(templateRegex, `<template>${templateContent}</template>`);
  fs.writeFileSync(file, newContent, 'utf8');
}

// 替换script标签下的汉字，并直接修改原文件
function replaceChineseInScript(file) {
  // 读取文件内容
  const content = fs.readFileSync(file, 'utf8');
  // 定义一个正则表达式，用于匹配script标签
  const scriptRegex = /<script>([\s\S]*?)<\/script>/;
  // 定义一个变量，用于存储script标签下的内容
  let scriptContent = '';
  // 遍历文件内容，匹配script标签
  content.replace(scriptRegex, (match, group) => {
    // 将script标签下的内容赋值给变量
    scriptContent = group;
  });
  // 定义一个正则表达式，用于匹配被单引号包围的汉字字符串
  const singleQuoteRegex = /'([\u4e00-\u9fa5，。？！：；“”‘’（）【】《》]+)'/g;
  // 替换被单引号包围的汉字字符串，如'汉字'，替换为this.$t('${prefix}.汉字')
  scriptContent = scriptContent.replace(singleQuoteRegex, (match, group) => {
    return `this.$t('${prefix}.${group}')`;
  });
  // 替换原文件内容
  const newContent = content.replace(scriptRegex, `<script>${scriptContent}</script>`);
  fs.writeFileSync(file, newContent, 'utf8');
}

// 定义一个函数，用于处理vue文件的国际化
function i18nVue(dirPath) {
  let chineseMap = {};
  // 遍历目录及其子目录
  function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        traverseDir(filePath);
      } else if (filePath.endsWith('.vue')) {
        // 提取汉字串
        chineseMap = { ...chineseMap, ...extractChineseStrings(filePath, dirPath) };
        // 替换template标签下的汉字
        replaceChineseInTemplate(filePath);
        // 替换script标签下的汉字
        replaceChineseInScript(filePath);
      }
    });
  }
  traverseDir(dirPath);
  // 将对象转换为json字符串
  const json = JSON.stringify(chineseMap, null, 2);
  // 写入json文件
  fs.writeFileSync(`${dirPath}.json`, json, 'utf8');
}

// 测试
const prefix = 'GEBA';
i18nVue('./applicant');