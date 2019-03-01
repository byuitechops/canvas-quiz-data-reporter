var path = require('path')
var fs = require('fs')

function main() {
    var filename = path.basename(process.argv[2]);
    var filepath = path.resolve(filename);
    if (path.extname(filename) !== '.json')
        throw 'Input must be a .json';
    var list = require(filepath);
    if (!Array.isArray(list))
        throw 'The JSON must be an array';
    var halfLength = Math.floor(list.length / 2);
    var list1 = JSON.stringify(list.slice(0, halfLength), null, 4);
    var list2 = JSON.stringify(list.slice(halfLength), null, 4);
    fs.writeFileSync(`./LIST1_${filename}`, list1);
    fs.writeFileSync(`./LIST2_${filename}`, list2);
}

main();