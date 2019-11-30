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
            const embed = new MessageEmbed()
                .setTitle(`:chart_with_upwards_trend: **Current ${_guild.name} Statistics** :chart_with_upwards_trend:`)
                .setColor('#ab47bc')
                .setDescription("Statistics are automatically updated every minute.")
                .addField(`Guild Time`, moment().format('LLLL'));

            if (statsMessage && statsMessageChannel) {

                // Edit the message containing stats
                var raidMitigation = ``;
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
                var raidMitigation2;
                if (_guild.settings.raidMitigation === 0)
                    raidMitigation2 = `**Level 0**` + "\n" + `:black_heart: New Member Verification: Medium Verification` + "\n" + `:black_heart: New Member Participation: Immediately on join` + "\n" + `:black_heart: Invite Links: Active` + "\n" + `:black_heart: Antispam Discipline: 30-minute mute`
                if (_guild.settings.raidMitigation === 1)
                    raidMitigation2 = `**Level 1**` + "\n" + `:red_heart: New Member Verification: Required Verified Phone Number` + "\n" + `:black_heart: New Member Participation: Immediately on join` + "\n" + `:black_heart: Invite Links: Active` + "\n" + `:yellow_heart: Antispam Discipline: Mute until staff remove it`
                if (_guild.settings.raidMitigation === 2)
                    raidMitigation2 = `**Level 2**` + "\n" + `:red_heart: New Member Verification: Required Verified Phone Number` + "\n" + `:red_heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:black_heart: Invite Links: Active` + "\n" + `:orange_heart: Antispam Discipline: 24-hour temp ban`
                if (_guild.settings.raidMitigation === 3)
                    raidMitigation2 = `**Level 3**` + "\n" + `:red_heart: New Member Verification: Required Verified Phone Number` + "\n" + `:red_heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:red_heart: Invite Links: Deleted / Not Allowed` + "\n" + `:red_heart: Antispam Discipline: permanent ban`
                embed.addField(`Raid Mitigation Status`, raidMitigation + "\n" + raidMitigation2);
                embed.addField(`Guild Members`, _guild.members.array().length);
                if (mostActiveUser !== '')
                    embed.addField(`Most Active Member`, mostActiveUser);
                embed.addField(`Guild Activity Index`, parseInt(activityLevel / _guild.members.array().length));


                _guild.channels.resolve(statsMessageChannel).messages.fetch(statsMessage)
                    .then(message => message.edit(``, { embed: embed }));
            }

            // Remove support channels that have expired
            _guild.channels
                .filter((channel) => channel.name.startsWith("support_"))
                .each((channel) => {
                    if ((!channel.lastMessage && moment(channel.createdAt).add(1, 'days').isBefore(moment())) || (channel.lastMessage && moment(channel.lastMessage.createdAt).add(1, 'days').isBefore(moment()))) {
                        channel.delete(`Support channel expired (24 hours of inactivity).`);
                    }
                });

            // Remove temp channels that have expired
            _guild.channels
                .filter((channel) => channel.name.endsWith("-temp14"))
                .each((channel) => {
                    if (moment(channel.createdAt).add(14, 'days').isBefore(moment())) {
                        channel.delete(`Temp channel expired (14 days since it was created).`);
                    }
                });

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
                // Add verifiedRole
                var verifiedRole = _guild.roles.resolve(_guild.settings.verifiedRole);
                if (verifiedRole) {
                    _guild.members.each((guildMember) => {
                        if (!guildMember.roles.get(verifiedRole.id)) {
                            guildMember.roles.add(verifiedRole, `Raid mitigation expired`);
                        }
                    });
                }

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

            // Guild advertisements
            const _channel = this.client.channels.resolve(_guild.settings.generalChannel);
            if (_channel && _guild.settings.ads && _guild.settings.ads.length > 0) {
                _guild.settings.ads.map((ad) => {
                    if (moment().isAfter(moment(ad.nextPost))) {
                        const _user = this.client.users.resolve(ad.author);
                        _guild.settings.update('ads', ad, { action: 'remove' })
                            .then(() => {
                                if (ad.postsLeft > 1 && _user && _guild.members.resolve(_user.id)) {
                                    _guild.settings.update('ads', {
                                        ID: ad.ID,
                                        author: ad.author,
                                        postsLeft: ad.postsLeft - 1,
                                        nextPost: moment().add(1, 'days').add(Math.floor(Math.random() * 24), 'hours').add(Math.floor(Math.random() * 60), 'minutes').toISOString(true),
                                        hereMention: ad.hereMention,
                                        adText: ad.adText
                                    }, { action: 'add' });
                                }
                            })
                        if (_user && _guild.members.resolve(_user.id)) {
                            const embed = new MessageEmbed()
                                .setTitle(`Community Advertisement`)
                                .setAuthor(_user.tag)
                                .setColor('#4527A0')
                                .setDescription(ad.adText)
                                .setFooter(`If you would like to purchase an ad with your Yang, use the bot command \`!ad\``)
                            _channel.send(`${ad.hereMention ? '@here' : ''}`, { embed });
                        }
                    }
                })
            }

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
                            this.client.emit('error', err)
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