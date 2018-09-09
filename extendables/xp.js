const {Extendable} = require('klasa');
const config = require("../config");
const moment = require("moment");
const stringSimilarity = require("string-similarity");

module.exports = class extends Extendable {

    constructor(...args) {
        super(...args, {appliesTo: ['Message']});
    }

    get extend() {
        var botPrefixes = ["!"];

        // Start with a base score of 1
        var score = 1;

        // Add score for embeds
        var numembeds = this.embeds.length;
        score += (numembeds);
        //console.log(`${numembeds} embeds`);

        // Add score for attachments
        var numattachments = this.attachments.size;
        score += (numattachments);
        //console.log(`${numattachments} attachments`);

        // Add score for length
        if (this.content.length >= 140)
            score += 1;
        if (this.content.length >= 256)
            score += 1;
        if (this.content.length >= 512)
            score += 1;
        if (this.content.length >= 1024)
            score += 1;

        // Subtract score for repeat patterns
        // TODO: improve this algorithm
        var newstring = this.content;
        var regex = /(\W|^)(.+)\s\2/gmi;
        var matcher = regex.exec(this.content);
        while (matcher !== null)
        {
            newstring = newstring.replace(matcher[2], ``);
            matcher = regex.exec(this.content);
        }
        var patternScore = (this.content.length > 0 ? (newstring.length / this.content.length) : 1);

        score *= ((patternScore - 0.5) * 2);
        score = parseInt(score);

        // If the message begins with any bot prefixes, consider it a bot command and do not score XP for it.
        botPrefixes.forEach((prefix) => {
            if (this.content.startsWith(prefix))
                score = 0;
        });

        // Calculate how many seconds this message took to type based off of 5 characters per second.
        var messageTime = (this.cleanContent.length / 5);

        // Iterate through messages of this channel from the last 3 minutes by the same author
        var collection = this.channel.messages
                .filter((message) => {
                    return message.id !== this.id && message.author.id === this.author.id && moment(this.createdAt).subtract(3, 'minutes').isBefore(moment(message.createdAt)) && moment(this.createdAt).isAfter(moment(message.createdAt));
                });
        //console.log(`${collection.size} messages`);
        collection.each((message) => {

            // If the current message was sent at a time that causes the typing speed to be more than 5 characters per second, no XP.
            var timediff = moment(this.createdAt).diff(moment(message.createdAt), 'seconds');
            if (timediff <= messageTime)
            {
                score = 0;
            }

            // If the current message is 90% or more similar to the comparing message, no XP for this message.
            var similarity = stringSimilarity.compareTwoStrings(this.content, message.content);
            if (similarity >= 0.9)
            {
                score = 0;
            }
        });

        // If the message contains a big string of repeating characters, consider it too spammy to earn any XP
        if (/(.)\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1/.test(this.content.toLowerCase()))
            score = 0;

        // If the message contains 10 or more new lines, consider it too spammy to earn any XP.
        var newlines = this.content.split(/\r\n|\r|\n/).length;
        if (newlines > 9)
            score = 0;

        // If the user is muted, no XP for them!
        if (this.member && this.guild && this.member.roles.get(this.guild.settings.muteRole))
            score = 0;

        // Activate reputation earning if XP score is at least 1, and the newstring (taking out repeat patterns) is at least 128 characters in length
        if (this.member && !this.author.bot)
        {
            if (score > 0 && newstring.length >= 128)
            {
                this.react("➕");
            } else if (!this.deleted) {
                this.reactions.removeAll();
            }
        }

        //console.log(`XP: ${score}`);
        return score;
    }

};

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

