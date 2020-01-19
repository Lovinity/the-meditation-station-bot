const { Task } = require('klasa');
const moment = require("moment");
const needle = require("needle");
const wordsearch = require('wordsearch-generator');
const { MessageEmbed } = require('discord.js');
const commonWords = require('../assets/commonWords.js');
const emoji = require('../assets/emoji.js');

module.exports = class extends Task {

    async run ({ guild }) {
        const _guild = this.client.guilds.resolve(guild);
        if (_guild) {
            var cooldown = _guild.settings.antispamCooldown;
            var generalChannel = _guild.channels.resolve(_guild.settings.generalChannel);
            var inactiveChannel = _guild.channels.resolve(_guild.settings.inactiveChannel);
            var modLogChannel = _guild.channels.resolve(_guild.settings.modLogChannel);
            var inactiveRole = _guild.roles.resolve(_guild.settings.inactiveRole);
            var mostActiveUsers = [];
            var mostActiveStaff;
            var highestActivityScore;
            var activityLevel = 0;
            var compare = (a, b) => {
                var sorter = b.settings.activityScore - a.settings.activityScore;
                return sorter;
            };
            _guild.members.sort(compare).each((guildMember) => {
                // Antispam cooldown
                var newScore = guildMember.settings.spamScore - cooldown;
                if (newScore < 0)
                    newScore = 0;
                guildMember.settings.update('spamScore', newScore);

                // Activity score cooldown
                var activityScore = guildMember.settings.activityScore;
                var newScore = 0;

                if (activityScore > 0) {
                    newScore = activityScore * 0.999;
                    guildMember.settings.update('activityScore', newScore);
                }

                if (!highestActivityScore)
                    highestActivityScore = newScore;

                activityLevel += newScore;

                // Calculate most active members
                if (!_guild.settings.staffRole || !guildMember.roles.get(_guild.settings.staffRole)) {
                    if (mostActiveUsers.length < 3 && newScore >= 1)
                        mostActiveUsers.push(guildMember.user.tag);
                } else if (_guild.settings.staffRole && guildMember.roles.get(_guild.settings.staffRole) && !mostActiveStaff && newScore >= 1) {
                    mostActiveStaff = guildMember.user.tag;
                }

                // Determine inactive users
                if (!guildMember.user.bot) {
                    if (guildMember.settings.lastMessage === null && moment().diff(moment(guildMember.joinedAt), 'hours') > (24 * 7)) {
                        if (inactiveRole && !guildMember.roles.get(inactiveRole.id)) {
                            guildMember.roles.add(inactiveRole, `New member has not sent a message in the last 7 days.`);
                            if (modLogChannel)
                                modLogChannel.send(`:zzz: New member ${guildMember.user.tag} (${guildMember.id}) has joined over 7 days ago without sending their first message. Marked inactive until they do.`)
                            if (inactiveChannel)
                                inactiveChannel.send(`:zzz: Hey <@${guildMember.id}>; it looks like you joined over 7 days ago but have not yet sent your first message. Say hi in any channel so we know you are not a lurker and wish to remain in our guild.`);
                        } else if (inactiveChannel && (Math.random() * 2880) > 2879) {
                            inactiveChannel.send(`:zzz: Hey <@${guildMember.id}>; we still haven't heard from you. Say hi in any channel so we know you're not a lurker and wish to remain in the guild.`)
                        }
                    }
                    if (guildMember.settings.lastMessage !== null && moment().diff(moment(guildMember.settings.lastMessage), 'days') > 30) {
                        if (inactiveRole && !guildMember.roles.get(inactiveRole.id)) {
                            guildMember.roles.add(inactiveRole, `Regular member has not sent any messages in the last 30 days.`);
                            if (modLogChannel)
                                modLogChannel.send(`:zzz: Member ${guildMember.user.tag} (${guildMember.id}) has not sent any messages in the last 30 days. Marked inactive until they do.`)
                            if (inactiveChannel)
                                inactiveChannel.send(`:zzz: Hey <@${guildMember.id}>; you haven't sent any messages in over 30 days. Say hi in any channel so we know you're okay, still around, and want to remain in the guild.`);
                        } else if (inactiveChannel && (Math.random() * 2880) > 2879) {
                            inactiveChannel.send(`:zzz: Hey <@${guildMember.id}>; we still haven't heard from you. Say hi in any channel so we know you're still around and wish to remain in the guild.`)
                        }
                    }
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
                    raidMitigation2 = `**Level 0**` + "\n" + `:black_heart: New Member Verification: Must be Discord member for 5 minutes` + "\n" + `:black_heart: New Member Participation: Immediately after answering verification question` + "\n" + `:black_heart: Invite Links: Allowed, but deleted when member leaves guild` + "\n" + `:black_heart: Antispam Discipline: 30-minute mute`
                if (_guild.settings.raidMitigation === 1)
                    raidMitigation2 = `**Level 1**` + "\n" + `:yellow_heart: New Member Verification: Cannot send messages for first 10 minutes` + "\n" + `:heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:black_heart: Invite Links: Allowed, but deleted when member leaves guild` + "\n" + `:yellow_heart: Antispam Discipline: Mute until staff remove it`
                if (_guild.settings.raidMitigation === 2)
                    raidMitigation2 = `**Level 2**` + "\n" + `:heart: New Member Verification: Required Verified Phone Number` + "\n" + `:heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:black_heart: Invite Links: Allowed, but deleted when member leaves guild` + "\n" + `:orange_heart: Antispam Discipline: 24-hour temp ban`
                if (_guild.settings.raidMitigation === 3)
                    raidMitigation2 = `**Level 3**` + "\n" + `:heart: New Member Verification: Required Verified Phone Number` + "\n" + `:heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:heart: Invite Links: Deleted / Not Allowed` + "\n" + `:heart: Antispam Discipline: permanent ban`
                embed.addField(`Raid Mitigation Status`, raidMitigation + "\n" + raidMitigation2);
                embed.addField(`Guild Members`, _guild.members.filter((member) => !member.user.bot).size);
                if (mostActiveUsers.length > 0) {
                    var mostActiveUsersText = ``;
                    mostActiveUsers.map((maUser, index) => {
                        mostActiveUsersText += `${index + 1}. ${maUser}` + "\n";
                    });
                    embed.addField(`Most Active Members Recently`, mostActiveUsersText);
                }
                if (mostActiveStaff)
                    embed.addField(`Most Active Staff Member Recently`, mostActiveStaff);
                embed.addField(`Guild Activity Index`, parseInt(activityLevel / _guild.members.filter((member) => !member.user.bot).size));


                _guild.channels.resolve(statsMessageChannel).messages.fetch(statsMessage)
                    .then(message => message.edit(``, { embed: embed }));
            }

            // Remove support channels that have expired
            _guild.channels
                .filter((channel) => channel.name.startsWith("support-"))
                .each((channel) => {
                    if ((!channel.lastMessage && moment(channel.createdAt).add(2, 'days').isBefore(moment())) || (channel.lastMessage && moment(channel.lastMessage.createdAt).add(2, 'days').isBefore(moment()))) {
                        channel.delete(`Support channel expired (48 hours of inactivity).`);
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
            _guild.channels
                .filter((channel) => channel.name.endsWith("-temp1"))
                .each((channel) => {
                    if ((!channel.lastMessage && moment(channel.createdAt).add(1, 'days').isBefore(moment())) || (channel.lastMessage && moment(channel.lastMessage.createdAt).add(1, 'days').isBefore(moment()))) {
                        channel.delete(`Temp channel expired (24 hours of inactivity).`);
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
                            invite.delete(`Raid mitigation level 3 active`);
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
                    var guildMembers = [];
                    _guild.members.each((guildMember) => {
                        if (!guildMember.roles.get(verifiedRole.id) && guildMember.settings.verified) {
                            guildMembers.push(guildMember.id);
                            guildMember.roles.add(verifiedRole, `Raid mitigation expired`);
                        }
                    });
                    if (generalChannel && guildMembers.length > 0) {
                        guildChannel.send(`**Welcome to our new members** ${guildMembers.map((gm) => gm = `<@${gm}> `)}` + "\n\n" + `The raid has ended, and you all now have full guild access. Thank you for your patience. Here are some tips to get started:`)
                            .then(() => {
                                guildChannel.send(`:small_orange_diamond: Be sure to check out the welcome channel for the rules and helpful resources. All members and staff must follow the rules.
:small_orange_diamond: Use the \`!staff\` bot command at any time if you need to talk privately with staff, such as to report another member.
:small_orange_diamond: Use the \`!profile\` bot command to get a link to view and edit your profile! Everyone in the guild gets a bot profile.`);
                            })
                    }
                }

                // Reset verification level
                _guild.setVerificationLevel(2);

                // Send announcement
                var channel = _guild.settings.announcementsChannel;
                const _channel = this.client.channels.resolve(channel);
                if (_channel) {
                    var response = `:ballot_box_with_check: **Raid mitigation has ended** :ballot_box_with_check: 

I do not detect raid activity anymore. Raid mitigation has ended. Thank you for your patience.
                    
New members who answered the verification question now have full guild access.
Guild verification is now set down to medium (must be a Discord member for 5 or more minutes).
${_guild.settings.raidMitigation >= 3 ? `**Please remember to re-generate invite links**. I do not re-generate those automatically. This includes the one for the website, and for any server list bots.` : ``}`;
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

            // Trivia game every 00, 06, 12, and 18, at :57
            if (m === 57 && h % 6 === 0) {
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

                                let embed = new MessageEmbed()
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

            // Word find game every 02, 08, 14, and 20, at :57
            if (m === 57 && h % 6 === 2) {
                console.log(`word find`);
                const botGamesChannel = _guild.settings.botGamesChannel;
                const _channel = this.client.channels.resolve(botGamesChannel);
                if (_channel) {
                    console.log(`channel`);
                    const words = [ commonWords[ Math.floor(Math.random() * commonWords.length) ] ];
                    const yang = words[ 0 ].length * 10;
                    const gridSize = words[ 0 ].length + 3;
                    let puzzleGrid = wordsearch.createPuzzle(gridSize, gridSize, 'en', words);
                    puzzleGrid = wordsearch.hideWords(puzzleGrid, 'en');
                    let lines = wordsearch.printGrid(puzzleGrid);
                    var gridText = ``;
                    for (let i = 0; i < lines.length; i++) {
                        gridText += lines[ i ] + "\n";
                    }

                    let embed = new MessageEmbed()
                        .setTitle(`Word Find Contest!`)
                        .setDescription(`Below is a word search with one hidden word. The first person to specify what the hidden word is earns ${yang} Yang. But hurry! You only have 3 minutes. Hint: The length of the hidden word is ${words[ 0 ].length} letters.`)
                        .setColor("BLUE")
                        .addField('Grid', `\`\`\`${gridText}\`\`\``);

                    _channel.send({ embed: embed });
                    _channel.awaitMessages(message => message.cleanContent.toLowerCase() === words[ 0 ],
                        { max: 1, time: 180000, errors: [ 'time' ] })
                        .then(messages => {
                            messages.first().member.settings.update('yang', messages.first().member.settings.yang + yang);
                            _channel.send(`:first_place: Congratulations to <@${messages.first().member.id}> who found the hidden word! It was ${words[ 0 ]}. You just earned ${yang} Yang.`);
                        })
                        .catch(() => {
                            _channel.send(`:hourglass: Time is up! The hidden word was ${words[ 0 ]}.`)
                        });
                }
            }

            // Emoji Lottery every 04, 10, 16, 22, at :57
            if (m === 57 && h % 6 === 4) {
                console.log(`Emoji Lottery`);
                const botGamesChannel = _guild.settings.botGamesChannel;
                const _channel = this.client.channels.resolve(botGamesChannel);
                if (_channel) {
                    var randomEmojis = shuffle(emoji);
                    var yangBet = Math.ceil(Math.random() * 20) + 5;
                    var emoji1 = randomEmojis.next().value;
                    var emoji2 = randomEmojis.next().value;
                    var emoji3 = randomEmojis.next().value;
                    var emoji4 = randomEmojis.next().value;

                    let embed = new MessageEmbed()
                        .setTitle(`Emoji roulette!`)
                        .setDescription(`You have 3 minutes to guess which of the 4 emojis at the bottom of this message will be destroyed.
* React to the emoji(s) you think will be destroyed. You must react to at least 1 to be considered playing the game, but you can react up to all 4 of them.
* Each emoji has a 50% chance of being destroyed. 
* If you react to an emoji that gets destroyed, you score a "match". You also score a "match" if you do not react to an emoji that does not get destroyed. 
* Winnings or losses are based on the number of matches as explained below.`)
                        .setColor("YELLOW")
                        .addField(`0 - 2 Matches`, `Lose ${yangBet} Yang`)
                        .addField(`3 Matches`, `Win ${yangBet * 4} Yang`)
                        .addField(`4 Matches`, `Win ${yangBet * 16} Yang`);

                    var message = await _channel.send({ embed: embed });
                    await message.react(emoji1.char);
                    await message.react(emoji2.char);
                    await message.react(emoji3.char);
                    await message.react(emoji4.char);

                    // Wait 3 minutes before collecting and processing bets.
                    setTimeout(async () => {
                        var message2 = await _channel.send(`:hourglass: And now, determining the fate of each emoji:
${emoji1.char}: ???
${emoji2.char}: ???
${emoji3.char}: ???
${emoji4.char}: ???`);
                        await message2.react(emoji1.char);
                        await message2.react(emoji2.char);
                        await message2.react(emoji3.char);
                        await message2.react(emoji4.char);
                        var emojiSelection = [ false, false, false, false ];

                        // Determine the emoji selection
                        switch (Math.floor(Math.random() * 16)) {
                            case 0:
                                emojiSelection = [ false, false, false, false ];
                                break;
                            case 1:
                                emojiSelection = [ false, false, false, true ];
                                break;
                            case 2:
                                emojiSelection = [ false, false, true, false ];
                                break;
                            case 3:
                                emojiSelection = [ false, true, false, false ];
                                break;
                            case 4:
                                emojiSelection = [ true, false, false, false ];
                                break;
                            case 5:
                                emojiSelection = [ false, false, true, true ];
                                break;
                            case 6:
                                emojiSelection = [ false, true, false, true ];
                                break;
                            case 7:
                                emojiSelection = [ true, false, false, true ];
                                break;
                            case 8:
                                emojiSelection = [ false, true, true, true ];
                                break;
                            case 9:
                                emojiSelection = [ true, false, true, true ];
                                break;
                            case 10:
                                emojiSelection = [ true, true, true, true ];
                                break;
                            case 11:
                                emojiSelection = [ false, true, true, false ];
                                break;
                            case 12:
                                emojiSelection = [ true, false, true, false ];
                                break;
                            case 13:
                                emojiSelection = [ true, true, false, false ];
                                break;
                            case 14:
                                emojiSelection = [ true, true, true, false ];
                                break;
                            case 15:
                                emojiSelection = [ true, true, false, true ];
                                break;
                        }

                        var reactions = {};
                        var matches = {};
                        var matches3 = [];
                        var matches4 = [];
                        var matches0 = [];

                        // Determine every user's reaction pattern
                        message.reactions.map((reaction) => {
                            reaction.users.map((user) => {
                                user.guildSettings(_guild.id)
                                    .then((settings) => {
                                        if (settings.yang >= yangBet) {

                                            if (typeof reactions[ user.id ] === 'undefined')
                                                reactions[ user.id ] = [ false, false, false, false ];

                                            if (reaction.emoji.name === emoji1.char)
                                                reactions[ user.id ][ 0 ] = true;
                                            if (reaction.emoji.name === emoji2.char)
                                                reactions[ user.id ][ 1 ] = true;
                                            if (reaction.emoji.name === emoji3.char)
                                                reactions[ user.id ][ 2 ] = true;
                                            if (reaction.emoji.name === emoji4.char)
                                                reactions[ user.id ][ 3 ] = true;
                                        }
                                    });
                            });
                        });

                        // Determine every user's number of matches
                        for (var userID in reactions) {
                            if (Object.prototype.hasOwnProperty.call(reactions, userID)) {
                                matches[ userID ] = 0;
                                for (var i = 0; i < 4; i++) {
                                    if (reactions[ userID ][ i ] === emojiSelection[ i ])
                                        matches[ userID ]++;
                                }
                            }
                        }

                        // Process Yang
                        for (var userID in matches) {
                            if (Object.prototype.hasOwnProperty.call(matches, userID)) {
                                var user = await this.client.users.fetch(userID);
                                var userSettings = await user.guildSettings(_guild.id);
                                if (user) {
                                    if (matches[ userID ] === 3) {
                                        settings.update('yang', settings.yang + (yangBet * 4))
                                        matches3.push(userID);
                                    } else if (matches[ userID ] === 4) {
                                        settings.update('yang', settings.yang + (yangBet * 16))
                                        matches4.push(userID);
                                    } else {
                                        settings.update('yang', settings.yang - yangBet)
                                        matches0.push(userID);
                                    }
                                }
                            }
                        }

                        // Process messages on a timer
                        setTimeout(() => {
                            message2.edit(`:hourglass: And now, determining the fate of each emoji:
${emoji1.char}: ${emojiSelection[ 0 ] ? `**DESTROYED**` : `SAFE`}
${emoji2.char}: ???
${emoji3.char}: ???
${emoji4.char}: ???`);
                            if (emojiSelection[ 0 ]) {
                                message2.reactions.map((reaction) => {
                                    if (reaction.emoji.name === emoji1.char) {
                                        reaction.users.map((user) => {
                                            reaction.users.remove(user);
                                        });
                                    }
                                });
                            }

                        }, 5000);
                        setTimeout(() => {
                            message2.edit(`:hourglass: And now, determining the fate of each emoji:
${emoji1.char}: ${emojiSelection[ 0 ] ? `**DESTROYED**` : `SAFE`}
${emoji2.char}: ${emojiSelection[ 1 ] ? `**DESTROYED**` : `SAFE`}
${emoji3.char}: ???
${emoji4.char}: ???`);
                            if (emojiSelection[ 1 ]) {
                                message2.reactions.map((reaction) => {
                                    if (reaction.emoji.name === emoji2.char) {
                                        reaction.users.map((user) => {
                                            reaction.users.remove(user);
                                        });
                                    }
                                });
                            }

                        }, 10000);
                        setTimeout(() => {
                            message2.edit(`:hourglass: And now, determining the fate of each emoji:
${emoji1.char}: ${emojiSelection[ 0 ] ? `**DESTROYED**` : `SAFE`}
${emoji2.char}: ${emojiSelection[ 1 ] ? `**DESTROYED**` : `SAFE`}
${emoji3.char}: ${emojiSelection[ 2 ] ? `**DESTROYED**` : `SAFE`}
${emoji4.char}: ???`);
                            if (emojiSelection[ 2 ]) {
                                message2.reactions.map((reaction) => {
                                    if (reaction.emoji.name === emoji3.char) {
                                        reaction.users.map((user) => {
                                            reaction.users.remove(user);
                                        });
                                    }
                                });
                            }

                        }, 15000);
                        setTimeout(() => {
                            message2.edit(`:hourglass: And now, determining the fate of each emoji:
${emoji1.char}: ${emojiSelection[ 0 ] ? `**DESTROYED**` : `SAFE`}
${emoji2.char}: ${emojiSelection[ 1 ] ? `**DESTROYED**` : `SAFE`}
${emoji3.char}: ${emojiSelection[ 2 ] ? `**DESTROYED**` : `SAFE`}
${emoji4.char}: ${emojiSelection[ 3 ] ? `**DESTROYED**` : `SAFE`}`);
                            if (emojiSelection[ 3 ]) {
                                message2.reactions.map((reaction) => {
                                    if (reaction.emoji.name === emoji4.char) {
                                        reaction.users.map((user) => {
                                            reaction.users.remove(user);
                                        });
                                    }
                                });
                            }

                        }, 20000);
                        setTimeout(() => {
                            var msg = `:second_place: These members won ${yangBet * 4} Yang with 3 matches: ${matches3.map((match) => `<@${match}>`).join(" ")}` + "\n";
                            msg += `:first_place: These members won ${yangBet * 16} Yang with 4 matches: ${matches4.map((match) => `<@${match}>`).join(" ")}` + "\n";
                            msg += `:cry: These members lost ${yangBet} Yang: ${matches0.map((match) => `<@${match}>`).join(" ")}` + "\n";
                            _channel.send(msg);
                        }, 25000);
                    }, 180000);
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

function* shuffle (array) {

    var i = array.length;

    while (i--) {
        yield array.splice(Math.floor(Math.random() * (i + 1)), 1)[ 0 ];
    }

}