const { Extendable } = require('klasa');
const config = require("../config");
const moment = require("moment");
const stringSimilarity = require("string-similarity");
const { Message } = require('discord.js');
const Perspective = require('perspective-api-client');
const perspective = new Perspective({ apiKey: config.perspectiveKey });
const { MessageEmbed } = require('discord.js');

module.exports = class extends Extendable {

    constructor(...args) {
        super(...args, { appliesTo: [ Message ] });
        this._earnedSpamScore = 0
    }

    get spamScore () {
        return new Promise(async (resolve, reject) => {
            if (this.type !== 'DEFAULT' || this.author.id === this.client.user.id)
                return resolve(0);

            // Start with a base score of 2
            var score = 2;
            var scoreReasons = {};

            /*
            // Add 3 points for every profane word used; excessive profanity spam
            config.profanity.map((word) => {
                var numbers = getIndicesOf(word, this.cleanContent, false);
                if (numbers.length > 0) {
                    score += 3;
                    //console.log(`profanity`);
                }
            });
            */

            // Executed after finishing perspective; manages multipliers
            var afterFunction = () => {
                // Start with a spam score multiplier of 0.5
                // spam score 50% if less strict channel AND less strict role
                // Spam score 100% if less strict channel OR less strict role
                // Spam score 150% if neither less strict channel nor less strict role
                // If the member is muted, the spam score will always be 150%
                var multiplier = 0.5;

                var isMuted = (this.member && this.guild && this.member.roles.get(this.guild.settings.muteRole));

                // If this is not a less strict channel, add 0.5 to the multiplier.
                if (this.guild.settings.antispamLessStrictChannels.indexOf(this.channel.id) === -1)
                    multiplier += 0.5;

                // If the member does not have a role defined in less strict roles, add 0.5 to the multiplier.
                if (typeof this.member !== 'undefined') {
                    var lessStrict = false;
                    this.member.roles
                        .filter((role) => {
                            return this.guild.settings.antispamLessStrictRoles.indexOf(role.id) !== -1;
                        })
                        .each((role) => {
                            lessStrict = true;
                        });
                    if (!lessStrict)
                        multiplier += 0.5;
                }
                if (isMuted)
                    multiplier = 1.5;

                //console.log(`${multiplier} multiplier`);

                // Flag messages with a high spam score
                var modLog = this.guild.settings.flagLogChannel;
                const _channel = this.client.channels.resolve(modLog);
                if (score > this.guild.settings.antispamCooldown) {
                    if (_channel) {
                        var embed = new MessageEmbed()
                            .setTitle(`Flagged message`)
                            .setDescription(`${this.cleanContent}`)
                            .setAuthor(this.author.tag, this.author.displayAvatarURL())
                            .setFooter(`Message channel **${this.channel.name}**`)
                            .addField(`Total Spam Score`, `Base: ${score}; multiplier: ${multiplier}; total: ${score * multiplier}`)
                            .setColor(`#ff7878`);
                        for (var key in scoreReasons) {
                            if (Object.prototype.hasOwnProperty.call(scoreReasons, key)) {
                                embed.addField(key, scoreReasons[ key ]);
                            }
                        }
                        _channel.sendEmbed(embed, `:bangbang: Please review message ${this.id}; it was flagged for having a high spam score.`)
                    }
                }

                score = parseInt(score * multiplier);

                console.log(`Total score: ${score}`)
            }
            console.log('Message spam score ' + this.id)
            // Add 5 score for each mention; mention spam
            var nummentions = this.mentions.users.size + this.mentions.roles.size;
            score += (5 * nummentions);
            if (nummentions > 0) { scoreReasons[ "Mentions" ] = (nummentions * 5) }

            // Add 10 score for each embed; link/embed spam
            var numembeds = this.embeds.length;
            score += (10 * numembeds);
            if (numembeds > 0) { scoreReasons[ "Embeds" ] = (nummembeds * 10) }

            // Add 10 score for each attachment; attachment spam
            var numattachments = this.attachments.size;
            score += (10 * numattachments);
            if (numattachments > 0) { scoreReasons[ "Attachments" ] = (numattachments * 10) }

            // Calculate how many seconds this message took to type based off of 7 characters per second.
            var messageTime = (this.cleanContent.length / 7);
            //console.log(`${messageTime} messagetime`);

            // Iterate through messages of this channel from the last 3 minutes by the same author
            var collection = this.channel.messages
                .filter((message) => {
                    return message.id !== this.id && message.author.id === this.author.id && moment(this.createdAt).subtract(3, 'minutes').isBefore(moment(message.createdAt)) && moment(this.createdAt).isAfter(moment(message.createdAt));
                });
            //console.log(`${collection.size} messages`);
            collection.each((message) => {

                // If the current message was sent at a time that causes the typing speed to be more than 7 characters per second, 
                // add score for flooding / copypasting. The faster / more characters typed, the more score added.
                var timediff = moment(this.createdAt).diff(moment(message.createdAt), 'seconds');
                if (timediff <= messageTime && !this.author.bot) {
                    score += parseInt((messageTime - timediff) + 1);
                    scoreReasons[ "Flooding / Rapid Typing" ] = parseInt((messageTime - timediff) + 1)
                }

                // If the current message is more than 80% or more similar to the comparing message, 
                // add 1 score for every (similarity % - 80) / 2; copy/paste spam. Multiply by 1 + (0.1 * (numcharacters / 100))
                var similarity = stringSimilarity.compareTwoStrings(`${this.content || ''}${JSON.stringify(this.embeds)}${JSON.stringify(this.attachments.array())}`, `${message.content || ''}${JSON.stringify(message.embeds)}${JSON.stringify(message.attachments.array())}`);
                if (similarity >= 0.8) {
                    score += parseInt((10 - ((1 - similarity) * 50)) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))));
                    scoreReasons[ "Copy-Pasting" ] = parseInt((10 - ((1 - similarity) * 50)) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))))
                }
            });

            // Score checks only if message content exists
            if (this.cleanContent && this.cleanContent.length > 0) {

                /* DISABLED; many false positives for emojis etc
                // If the message contains any off-the-wall characters, consider it spam and add 10 to the score.
                if (/[^\x20-\x7E]/g.test(this.cleanContent || '')) {
                    score += 10;
                    console.log(`special characters: 10`);
                }
                */

                // Count uppercase and lowercase letters
                var uppercase = this.cleanContent.replace(/[^A-Z]/g, "").length;
                var lowercase = this.cleanContent.replace(/[^a-z]/g, "").length;

                // If 50% or more of the characters are uppercase, consider it shout spam,
                // and add a score of 5, plus 1 for every 12.5 uppercase characters.
                if (uppercase >= lowercase) {
                    score += parseInt(5 + (20 * (uppercase / 250)));
                    scoreReasons[ "Uppercase / Shouting" ] = parseInt(5 + (20 * (uppercase / 250)))
                }

                // Add score for repeating consecutive characters
                // 20 or more consecutive repeating characters = extremely spammy. Add 20 score.
                if (/(.)\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
                    score += 20;
                    scoreReasons[ "Repeating Characters" ] = 20
                    // 10 or more consecutive repeating characters = spammy. Add 10 score.
                } else if (/(.)\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
                    score += 10;
                    scoreReasons[ "Repeating Characters" ] = 10
                    // 5 or more consecutive repeating characters = a little bit spammy. Add 5 score.
                } else if (/(.)\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
                    score += 5;
                    scoreReasons[ "Repeating Characters" ] = 5
                }

                // Add 40 score for here and everyone mentions as these are VERY spammy.
                if (this.cleanContent.includes("@here") || this.cleanContent.includes("@everyone")) {
                    score += 40;
                    scoreReasons[ "Here / Everyone Mention" ] = 40
                }

                // Add 2 score for every new line; scroll spam
                var newlines = this.cleanContent.split(/\r\n|\r|\n/).length - 1;
                score += (newlines * 2);
                if (newlines > 0) { scoreReasons[ "New Lines / Scrolling" ] = (newlines * 2) }

                // Add score for repeating patterns
                // TODO: improve this algorithm
                var newstring = this.cleanContent;
                var regex = /(\W|^)(.+)\s\2/gmi;
                var matcher = regex.exec(this.cleanContent);
                while (matcher !== null) {
                    newstring = newstring.replace(matcher[ 2 ], ``);
                    matcher = regex.exec(this.cleanContent);
                }
                var patternScore = (this.cleanContent.length > 0 ? (newstring.length / this.cleanContent.length) : 1);

                // Pattern score of 100% means no repeating patterns. For every 4% less than 100%, add 1 score. Multiply depending on content length.
                score += parseInt(((1 - patternScore) * 25) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))))
                if (patternScore < 1) { scoreReasons[ "Repeating Patterns" ] = parseInt(((1 - patternScore) * 25) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0)))) }

                // Perspective API check and score add
                try {
                    var body = await perspective.analyze(this.cleanContent, { attributes: [ 'SEVERE_TOXICITY' ], doNotStore: false })
                    var threatening = false
                    var toxic = false
                    var hadAttributes = false
                    var perspectiveMultiplier = 1 + (this.cleanContent.length / 1000)
                    for (const key of Object.keys(body.attributeScores)) {
                        if (typeof body.attributeScores[ key ].spanScores !== 'undefined' && body.attributeScores[ key ].spanScores.length > 0) {
                            hadAttributes = true
                            body.attributeScores[ key ].spanScores.map((spanScore) => {
                                switch (key) {
                                    case 'SEVERE_TOXICITY':
                                        score += parseInt((spanScore.score.value * 50) * perspectiveMultiplier)
                                        scoreReasons[ "Perspective Toxicity / Provocative Nature" ] = parseInt((spanScore.score.value * 50) * perspectiveMultiplier)
                                        if (spanScore.score.value >= (0.9 - (this.cleanContent.length / 4000))) {
                                            toxic = true
                                        }
                                        break;
                                }
                            })
                        } else if (typeof body.attributeScores[ key ].summaryScore !== 'undefined') {
                            console.log(`summary ${key}: ${body.attributeScores[ key ].summaryScore.value} / ${(0.9 - (this.cleanContent.length / 4000))}`)
                            hadAttributes = true
                            switch (key) {
                                case 'SEVERE_TOXICITY':
                                    score += parseInt((body.attributeScores[ key ].summaryScore.value * 50) * perspectiveMultiplier)
                                    scoreReasons[ "Perspective Toxicity / Provocative Nature" ] = parseInt((body.attributeScores[ key ].summaryScore.value * 50) * perspectiveMultiplier)
                                    if (body.attributeScores[ key ].summaryScore.value >= (0.9 - (this.cleanContent.length / 4000))) {
                                        toxic = true
                                    }
                                    break;
                            }
                        } else {
                        }
                    }
                    afterFunction()
                    return resolve(score)
                } catch (e) {
                    this.client.emit('error', e)
                    afterFunction()
                    return resolve(score)
                }
            } else {
                afterFunction()
                return resolve(score)
            }
        })
    }

    get earnedSpamScore () {
        return this._earnedSpamScore;
    }

    set earnedSpamScore (value) {
        this._earnedSpamScore = value;
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