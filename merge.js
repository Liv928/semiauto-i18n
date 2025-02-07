// 假设你有两个json文件，分别命名为file1.json和file2.json
// 你可以用fs模块读取这两个文件的内容
const fs = require('fs');
// 用JSON.parse方法将文件内容转换为对象
const obj1 = JSON.parse(fs.readFileSync('index.json', 'utf8'));
const obj2 = JSON.parse(fs.readFileSync('Cust.vue.json', 'utf8'));
// 用Object.assign方法将两个对象的字段合并，如果有重复的字段，则保留第一个对象的值
const obj3 = Object.assign({}, obj2, obj1);
// 用JSON.stringify方法将合并后的对象转换为字符串
const str3 = JSON.stringify(obj3, null, 2);
// 用fs模块写入一个新的文件，命名为file3.json
fs.writeFileSync('index.json', str3, 'utf8');
