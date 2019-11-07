const { Extendable } = require('klasa');
const config = require("../config");
const moment = require("moment");
const stringSimilarity = require("string-similarity");
const { Message } = require('discord.js');

module.exports = class extends Extendable {

    constructor(...args) {
        super(...args, { appliesTo: [ Message ] });
        this._earnedXp = 0
    }

    get xp () {
        if (this.type !== 'DEFAULT')
            return null;
        var botPrefixes = [ "!", "p!", "r!", "t!", "t@" ];

        // Start with a base score of 0
        var score = 0;

        // Add score for embeds
        var numembeds = this.embeds.length;
        score += (numembeds);
        //console.log(`${numembeds} embeds`);

        // Add score for attachments
        var numattachments = this.attachments.size;
        score += (2 * numattachments);
        //console.log(`${numattachments} attachments`);

        // Add score for length
        if (this.content.length >= 1)
            score += 1;
        if (this.content.length >= 128)
            score += 1;
        if (this.content.length >= 256)
            score += 1;
        if (this.content.length >= 512)
            score += 1;
        if (this.content.length >= 768)
            score += 1;
        if (this.content.length >= 1024)
            score += 1;
        if (this.content.length >= 1536)
            score += 1;

        // If the message begins with any bot prefixes, consider it a bot command and do not score XP for it.
        botPrefixes.map((prefix) => {
            if (this.content.startsWith(prefix))
                score = 0;
        });

        //console.log(`XP: ${score}`);
        return score;
    }

    get earnedXp () {
        return this._earnedXp
    }

    set earnedXp (value) {
        this._earnedXp = value
    }

};

function getIndicesOf (searchStr, str, caseSensitive) {
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

