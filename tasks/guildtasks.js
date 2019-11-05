const { Task } = require('klasa');
const moment = require("moment");
const needle = require("needle");
const { MessageEmbed } = require('discord.js');

module.exports = class extends Task {

    async run ({ guild }) {
        const _guild = this.client.guilds.resolve(guild);
        if (_guild) {
            var cooldown = _guild.settings.antispamCooldown;
            var mostActiveUser = ``;
            var highestActivityScore = 0;
            var activityLevel = 0;
            _guild.members.each((guildMember) => {
                // Antispam cooldown
                var newScore = guildMember.settings.spamScore - cooldown;
                if (newScore < 0)
                    newScore = 0;
                guildMember.settings.update('spamScore', newScore);

                // Activity score cooldown
                var activityScore = guildMember.settings.activityScore;
                if (activityScore > 0) {
                    var newScore = activityScore * 0.999;
                    guildMember.settings.update('activityScore', newScore);
                }

                // Calculate most active user and current activity level
                activityLevel += newScore
                if (newScore > highestActivityScore) {
                    highestActivityScore = newScore
                    mostActiveUser = guildMember.user.tag
                }
            });

            // Update highest activity score
            _guild.settings.update('highestActivityScore', highestActivityScore)

            // Do stats
            const statsMessageChannel = _guild.settings.statsMessageChannel;
            const statsMessage = _guild.settings.statsMessage;

            if (statsMessage && statsMessageChannel) {

                // Edit the message containing stats
                var raidMitigation = `Anti-raid: `;
                var score = _guild.settings.raidScore;
                var minuses = 9;
                while (score > 0) {
                    minuses--;
                    score -= 20;
                    raidMitigation = `${raidMitigation} :warning: `
                    if (minuses === 6) {
                        raidMitigation = `${raidMitigation} :one: `
                    } else if (minuses === 3) {
                        raidMitigation = `${raidMitigation} :two: `
                    } else if (minuses === 0) {
                        raidMitigation = `${raidMitigation} :three: `
                    }
                }
                while (minuses > 0) {
                    minuses--;
                    raidMitigation = `${raidMitigation} :heavy_minus_sign: `
                    if (minuses === 6) {
                        raidMitigation = `${raidMitigation} :one: `
                    } else if (minuses === 3) {
                        raidMitigation = `${raidMitigation} :two: `
                    } else if (minuses === 0) {
                        raidMitigation = `${raidMitigation} :three: `
                    }
                }
                if (_guild.settings.raidMitigation === 0)
                    raidMitigation = `${raidMitigation} **Level 0 (No mitigation; spamming = 30-minute mute)** `
                if (_guild.settings.raidMitigation === 1)
                    raidMitigation = `${raidMitigation} **Level 1 (Verified Phone Numbers for new members; spamming = untimed mute)** `
                if (_guild.settings.raidMitigation === 2)
                    raidMitigation = `${raidMitigation} **Level 2 (Verified Phone Numbers + guild isolation for new members; spamming = 24-hour ban)** `
                if (_guild.settings.raidMitigation === 3)
                    raidMitigation = `${raidMitigation} **Level 3 (All invite links deleted; verified Phone Numbers + guild isolation for new members; spamming = permanent ban)** `
                var themessage = `:chart_with_upwards_trend: **Current ${_guild.name} Statistics** (edited automatically every minute) :chart_with_upwards_trend: \n\n`;
                themessage = themessage + `Current Guild Time:  **${moment().format('LLLL')}** \n`;
                themessage = themessage + `Number of members in the guild: **${_guild.members.array().length}** \n`;
                themessage = themessage + `Most active member: **${mostActiveUser}** \n`;
                themessage = themessage + `Guild Activity Index: **${parseInt(activityLevel / _guild.members.array().length)}** \n`;
                themessage = themessage + `${raidMitigation} \n`;


                _guild.channels.resolve(statsMessageChannel).messages.fetch(statsMessage)
                    .then(message => message.edit(themessage));
            }

            // Do icebreakers
            var n = new Date();
            var m = n.getMinutes();
            var h = n.getHours();

            if (m === 0 && (h === 6 || h === 12 || h === 18 || h === 0)) {
                const iceBreakerChannel = _guild.settings.iceBreakerChannel;
                const _channel = this.client.channels.resolve(iceBreakerChannel);
                if (_channel) {
                    var iceBreakers = _guild.settings.icebreakers;
                    _channel.send(`:snowflake: **Time for another ice breaker question!** :snowflake:
                    
${iceBreakers[ Math.floor(Math.random() * iceBreakers.length) ]}
`);
                }

            }

            // Delete all invites if under mitigation level 3
            if (_guild && _guild.settings.raidMitigation >= 3) {
                _guild.fetchInvites()
                    .then(invites => {
                        invites.each(invite => {
                            invite.delete();
                        });
                    })
            }

            // Raid score cool-down
            var newscore = _guild.settings.raidScore - 1;
            if (newscore < 0)
                newscore = 0;
            _guild.settings.update('raidScore', newscore);

            // Raid mitigation ends
            if (newscore <= 0 && _guild.settings.raidMitigation > 0) {
                // Remove raidRole
                _guild.members.each((guildMember) => {
                    var raidRole = _guild.roles.resolve(_guild.settings.raidRole);
                    if (raidRole) {
                        if (guildMember.roles.get(raidRole.id)) {
                            guildMember.roles.remove(raidRole, `Raid mitigation expired`);
                        }
                    }
                });

                // Reset verification level
                _guild.setVerificationLevel(2);

                // Send announcement
                var channel = _guild.settings.announcementsChannel;
                const _channel = this.client.channels.resolve(channel);
                if (_channel) {
                    var response = `:ballot_box_with_check: **Raid mitigation has ended** :ballot_box_with_check: 

I do not detect raid activity anymore. Raid mitigation has ended. Thank you for your patience.
                    
All new members now have full access to the guild.
Verification is now set down to medium.
${_guild.settings.raidMitigation >= 3 ? `**Please remember to re-generate invite links**. I do not re-generate those automatically.` : ``}`;
                    _channel.send(response);
                }

                // Disable mitigation in settings
                _guild.settings.update('raidMitigation', 0);
            }

            // Check for voice channel listening and award XP for listeners
            _guild.channels
                .filter((channel) => channel.type === 'voice')
                .each((channel) => {
                    var award = false;
                    var awardTo = [];
                    channel.members
                        .each((guildMember) => {
                            // Is the member undeaf and not a bot? They deserve a listening award!
                            if (!guildMember.voice.deaf && !guildMember.user.bot)
                                awardTo.push(guildMember);
                            // Is the member unmuted and not a bot? Award listening XP/Yang to qualified members (if no one is unmuted, no one gets rewarded)
                            // Every 2 minutes, allow for XP rewarding even if the only speaking member is a bot
                            if (!guildMember.voice.mute && (!guildMember.user.bot || m % 2 === 0))
                                award = true;
                        });

                    // Award XP to everyone who qualifies if the channel as a whole qualifies
                    if (award && awardTo.length > 1) {
                        awardTo.forEach((guildMember) => {
                            guildMember.xp(1);
                        });
                    }
                });

            // tri-hourly Trivia Game at minute 58
            if (m === 58 && h % 3 === 0) {
                console.log(`trivia`);
                const botGamesChannel = _guild.settings.botGamesChannel;
                const _channel = this.client.channels.resolve(botGamesChannel);
                if (_channel) {
                    console.log(`channel`);
                    needle('get', 'http://jservice.io/api/random', {}, { json: true })
                        .then((response) => {
                            console.log(`response`);
                            response = response.body[ 0 ];
                            if (response && response.invalid_count === null) {
                                console.log(`Valid input`);
                                var category = response.category.title;
                                var clue = response.question;
                                var answer = response.answer;
                                var yang = response.value !== null ? (response.value / 10) : 20;

                                var embed = new MessageEmbed()
                                    .setTitle(`Trivia Contest!`)
                                    .setDescription(`The first person to answer this question correctly will win **${yang}** Yang! But hurry... you only have 3 minutes to answer! Make your guesses as messages. I will respond if and only if you have the correct answer.`)
                                    .setColor("GREEN")
                                    .addField('Category', category)
                                    .addField('Clue', clue);

                                _channel.send({ embed: embed });
                                _channel.awaitMessages(message => slugify(message.cleanContent).includes(slugify(answer)),
                                    { max: 1, time: 180000, errors: [ 'time' ] })
                                    .then(messages => {
                                        messages.first().member.settings.update('yang', messages.first().member.settings.yang + yang);
                                        _channel.send(`:first_place: Congratulations to <@${messages.first().member.id}> who got the answer correct! It was ${answer}. You just earned ${yang} Yang.`);
                                    })
                                    .catch(() => {
                                        _channel.send(`:hourglass: Time is up! The answer was ${answer}.`)
                                    });
                            }
                        })
                        .catch(function (err) {
                            console.error(err);
                        })
                }
            }
        }
    }

};

function slugify (text) {
    return text.toString().toLowerCase()
        .replace(/^(a |an |the |his |her |their |your |it's |its)/, '')        // Remove a, an, the, his, her, their, your, it's, its from the beginning
        .replace(/ *\([^)]*\) */g, '')    // Remove anything in parenthesis
        .replace(/(\<i\>|\<\/i\>)/g, '')    // Remove <i> and </i> HTML entities
        .replace('&', 'and')                // Replace & with "and"
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}