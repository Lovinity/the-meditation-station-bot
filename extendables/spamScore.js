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
    }

    get spamScore () {
        return new Promise(async (resolve, reject) => {
            if (this.type !== 'DEFAULT' || this.author.id === this.client.user.id)
                return resolve(0);

            // Start with a base score of 2
            var score = 2;

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

            // Executed after finishing perspective
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

                score *= multiplier;
            }

            // Add score if there are any mentions; mention spam
            var nummentions = this.mentions.users.size + this.mentions.roles.size;
            score += (5 * nummentions);
            //console.log(`${nummentions} mentions`);

            // Add score for embeds; link/embed spam
            var numembeds = this.embeds.length;
            score += (10 * numembeds);
            //console.log(`${numembeds} embeds`);

            // Add score for attachments; attachment spam
            var numattachments = this.attachments.size;
            score += (10 * numattachments);
            //console.log(`${numattachments} attachments`);

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

                // If the current message was sent at a time that causes the typing speed to be more than 7 characters per second, add score for flooding / copypasting.
                var timediff = moment(this.createdAt).diff(moment(message.createdAt), 'seconds');
                if (timediff <= messageTime && !this.author.bot) {
                    score += 10;
                    //console.log(`Flooding`);
                }

                // If the current message is 90% or more similar to the comparing message, add score for duplicate message spamming.
                var similarity = stringSimilarity.compareTwoStrings(`${this.content || ''}${JSON.stringify(this.embeds)}${JSON.stringify(this.attachments.array())}`, `${message.content || ''}${JSON.stringify(message.embeds)}${JSON.stringify(message.attachments.array())}`);
                if (similarity >= 0.9) {
                    score += 10;
                    //console.log(`String similarity`);
                }
            });

            // Score checks only if message content exists
            if (this.cleanContent && this.cleanContent.length > 0) {

                // If the message contains any off-the-wall characters, consider it spam and add 10 to the score.
                if (/[^\x20-\x7E]/g.test(this.cleanContent || '')) {
                    score += 10;
                    //console.log(`special characters`);
                }

                // Count uppercase and lowercase letters
                var uppercase = this.cleanContent.replace(/[^A-Z]/g, "").length;
                var lowercase = this.cleanContent.replace(/[^a-z]/g, "").length;

                // If 50% or more of the characters are uppercase, consider it shout spam, and add 10 to the score.
                if (uppercase >= lowercase) {
                    score += 10;
                    //console.log(`>50% uppercase`);
                }

                // Add score for repeating consecutive characters
                // 25 or more consecutive repeating characters = extremely spammy
                if (/(.)\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
                    score += 20;
                    // 10 or more consecutive repeating characters = spammy
                } else if (/(.)\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
                    score += 10;
                    // 5 or more consecutive repeating characters = a little bit spammy
                } else if (/(.)\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
                    score += 5;
                }

                // Add score for here and everyone mentions
                if (this.cleanContent.includes("@here") || this.cleanContent.includes("@everyone"))
                    score += 40;

                // Add 1 score for every new line; scroll spam
                var newlines = this.cleanContent.split(/\r\n|\r|\n/).length;
                score += newlines;

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

                // 60% or lower means lots of repeating patterns, thus very spammy.
                if (patternScore < 0.6) {
                    score += 20;
                } else if (patternScore < 0.8) {
                    score += 10;
                } else if (patternScore < 0.9) {
                    score += 5;
                }

                // Perspective API check
                try {
                    var body = await perspective.analyze(this.cleanContent, { attributes: [ 'IDENTITY_ATTACK', 'TOXICITY', 'SEVERE_TOXICITY', 'PROFANITY', 'THREAT', 'SPAM', 'PROFANITY', 'SEXUALLY_EXPLICIT' ], doNotStore: false })
                    var threatening = false
                    var toxic = false
                    for (const key of Object.keys(body.attributeScores)) {
                        if (typeof body.attributeScores[ key ].spanScores !== 'undefined' && body.attributeScores[ key ].spanScores.length > 0) {
                            body.attributeScores[ key ].spanScores.map((spanScore) => {
                                console.log(`spanScore ${key}: ${spanScore.score.value} / ${(0.95 - (this.cleanContent.length / 4000))}`)
                                if (spanScore.score.value >= (0.95 - (this.cleanContent.length / 4000))) {
                                    switch (key) {
                                        case 'SEVERE_TOXICITY':
                                            score += 30;
                                            toxic = true
                                            break;
                                        case 'TOXICITY':
                                            score += 10;
                                            toxic = true
                                            break;
                                        case 'THREAT':
                                            score += 50;
                                            threatening = true
                                            break;
                                        case 'SPAM':
                                            score += 20;
                                            break;
                                        case 'PROFANITY':
                                            score += 10;
                                            break;
                                        case 'SEXUALLY_EXPLICIT':
                                            score += 10;
                                            break;
                                        case 'IDENTITY_ATTACK':
                                            score += 20;
                                            toxic = true
                                            break;

                                    }
                                }
                            })
                        } else {
                            console.log(`summary ${key}: ${body.attributeScores[ key ].summaryScore.value} / ${(0.95 - (this.cleanContent.length / 4000))}`)
                            if (body.attributeScores[ key ].summaryScore.value >= (0.95 - (this.cleanContent.length / 4000))) {
                                switch (key) {
                                    case 'SEVERE_TOXICITY':
                                        score += 30;
                                        toxic = true
                                        break;
                                    case 'TOXICITY':
                                        score += 10;
                                        toxic = true
                                        break;
                                    case 'PROFANITY':
                                        score += 10;
                                        break;
                                    case 'THREAT':
                                        score += 50;
                                        threatening = true
                                        break;
                                    case 'SPAM':
                                        score += 20;
                                        break;
                                    case 'SEXUALLY_EXPLICIT':
                                        score += 5;
                                        break;
                                    case 'IDENTITY_ATTACK':
                                        score += 20;
                                        toxic = true
                                        break;

                                }
                            }
                        }
                    }
                    var modLog = this.guild.settings.modLogChannel;
                    const _channel = this.client.channels.resolve(modLog);
                    if (threatening) {
                        this.reply(`:bangbang: **Threats are not cool!** Please don't say stuff like that again; it's against the rules.`)
                        if (_channel) {
                            var embed = new MessageEmbed()
                                .setTitle(`Message flagged as threatening`)
                                .setDescription(`${this.cleanContent}`)
                                .setAuthor(this.author.tag, this.author.displayAvatarURL())
                                .setFooter(`Message channel **${this.channel.name}**`)
                                .setColor(`#ff7878`);
                            _channel.sendEmbed(embed, `:bangbang: Please review message ${this.id}; it was flagged for being threatening.`)
                        }
                    } else if (toxic) {
                        this.reply(`:bangbang: Hey now, please be respectful.`)
                        if (_channel) {
                            var embed = new MessageEmbed()
                                .setTitle(`Message flagged as provocative`)
                                .setDescription(`${this.cleanContent}`)
                                .setAuthor(this.author.tag, this.author.displayAvatarURL())
                                .setFooter(`Message channel **${this.channel.name}**`)
                                .setColor(`#ff7878`);
                            _channel.sendEmbed(embed, `:bangbang: Please review message ${this.id}; it was flagged for being provocative.`)
                        }
                    }
                    afterFunction()
                    return resolve(score)
                } catch (e) {
                    this.client.console.error(e);
                    afterFunction()
                    return resolve(score)
                }
            } else {
                afterFunction()
                return resolve(score)
            }
        })
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