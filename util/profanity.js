var config = require('../config.js');
var profaneWords = 0;
module.exports = function (string) {
    config.profanity.forEach(function (word) {
        var numbers = getIndicesOf(word, string, false);
        if (numbers.length > 0)
        {
            profaneWords += numbers.length;
        }
    });
    
    return profaneWords;
}


function getIndicesOf(searchStr, str, caseSensitive) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

