// const cheerio = require('cheerio');
/*************************************************************************
 * Searches through an object using recursion any time an object is found 
 *************************************************************************/

module.exports = function deepSearch(searchItem, searchPhrase) {
    /*********************************************************************
     * Stringifies the item passed in, and compares it through RegEx
     *********************************************************************/
    function compareValues(searchValue, searchExpression) {
        const specialValues = { null: 'null', undefined: 'undefined' }; // Non-Object Values that don't have a toString method
        if (specialValues[searchValue]) searchValue = specialValues[searchValue];
        if (specialValues[searchExpression]) searchExpression = specialValues[searchExpression];
        // Preprare Regex
        // let search = typeof searchExpression === 'string' ? searchExpression : searchExpression.toString();
        let value = typeof searchValue === 'string' ? searchValue : searchValue.toString();
        let searchExp = new RegExp(searchPhrase);
        // Test Phrases
        // value = cheerio.load(value).text();
        return searchExp.test(value);
    }

    /*********************************************************************
     * 
     *********************************************************************/
    function recursiveSearch(item, accumulator, searchPath = []) {
        if (typeof item === 'object' && item !== null) {
            var keys = Object.keys(item);
            keys.forEach(key => uniqueKeys.find((unique) => unique === key) || uniqueKeys.push(key));
            keys.forEach(key => { recursiveSearch(item[key], accumulator, searchPath.concat(key)); });
        } else if (compareValues(item, searchPhrase)) {
            accumulator.push({ match: item, path: searchPath });
        }
    }

    var searchMatches = []; // The thing to hold data between recursions
    var uniqueKeys = [];
    recursiveSearch(searchItem, searchMatches, []);
    searchMatches.uniqueKeys = uniqueKeys;
    return searchMatches;

};