const {Extendable} = require('klasa');
const config = require("../config");
const moment = require("moment");
const stringSimilarity = require("string-similarity");

module.exports = class extends Extendable {

    constructor(...args) {
        super(...args, {appliesTo: ['Message']});
    }

    get extend() {
        // Start with a base score of 2
        var score = 2;

        // Count uppercase and lowercase letters
        var uppercase = this.cleanContent.replace(/[^A-Z]/g, "").length;
        var lowercase = this.cleanContent.replace(/[^a-z]/g, "").length;

        // If 50% or more of the characters are uppercase, consider it shout spam, and add 10 to the score.
        if (uppercase >= lowercase)
        {
            score += 10;
            //console.log(`>50% uppercase`);
        }

        // If the message contains any off-the-wall characters, consider it spam and add 10 to the score.
        if (/[^\x20-\x7E]/g.test(this.content))
        {
            score += 10;
            //console.log(`special characters`);
        }

        // Add 3 points for every profane word used
        config.profanity.forEach((word) => {
            var numbers = getIndicesOf(word, this.cleanContent, false);
            if (numbers.length > 0)
            {
                score += 3;
                //console.log(`profanity`);
            }
        });

        // Add score if there are any mentions
        var nummentions = this.mentions.users.size + this.mentions.roles.size;
        score += (5 * nummentions);
        //console.log(`${nummentions} mentions`);

        // Add score for embeds
        var numembeds = this.embeds.length;
        score += (10 * numembeds);
        //console.log(`${numembeds} embeds`);

        // Add score for attachments
        var numattachments = this.attachments.size;
        score += (10 * numattachments);
        //console.log(`${numattachments} attachments`);

        // Calculate how many seconds this message took to type based off of 5 characters per second.
        var msgTime = (this.cleanContent.length / 5);
        //console.log(`${msgTime} msgtime`);

        // Iterate through messages of this channel from the last 3 minutes by the same author
        var collection = this.channel.messages
                .filter((msg) => {
                    return msg.id !== this.id && msg.author.id === this.author.id && moment(this.createdAt).subtract(3, 'minutes').isBefore(moment(msg.createdAt));
                });
                //console.log(`${collection.size} messages`);
        collection.each((msg) => {

            // If the current message was sent at a time that causes the typing speed to be more than 5 characters per second, add score for flooding.
            var timediff = moment(this.createdAt).diff(moment(msg.createdAt), 'seconds');
            if (timediff <= msgTime)
            {
                score += 10;
                //console.log(`Flooding`);
            }

            // If the current message is 90% or more similar to the comparing message, add score.
            var similarity = stringSimilarity.compareTwoStrings(this.content, msg.content);
            if (similarity >= 0.9)
            {
                score += 5;
                //console.log(`String similarity`);
            }
        });


        var multiplier = 0.5;
        // If this is not a less strict channel, add 50% to the score
        if (this.guild.settings.get('antispamLessStrictChannels').indexOf(this.channel.id) === -1)
            multiplier += 0.5;

        // If the member does not have a role defined in less strict roles, add 50% to the score.
        if (typeof this.member !== 'undefined')
        {
            var lessStrict = false;
            this.member.roles
                    .filter((role) => {
                        return this.guild.settings.get('antispamLessStrictRoles').indexOf(role.id) !== -1;
                    })
                    .each((role) => {
                        lessStrict = true;
                    });
            if (!lessStrict)
                multiplier += 0.5;
        }
        //console.log(`${multiplier} multiplier`);

        score *= multiplier;

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