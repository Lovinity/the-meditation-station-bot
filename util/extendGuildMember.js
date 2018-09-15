const {Structures} = require('discord.js');
const moment = require("moment");
require("moment-duration-format");
const GuildDiscipline = require('./guildDiscipline');
const config = require("../config");

Structures.extend('GuildMember', GuildMember => class MyGuildMember extends GuildMember {

        constructor(...args) {
            super(...args);
            this.settings = this.client.gateways.user.get(`${this.id}`, true)[this.guild.id];
            this.settings.update = (key, data, options = {}) => {
                return this.user.settings.update(`${this.guild.id}.${key}`, data, options);
            };
            this.settings.reset = (key) => {
                return this.user.settings.reset(`${this.guild.id}.${key}`);
            };
            this.spamScoreStamp = null;
            this.spamScore = (score, message) => {

                // Ignore if score = 0
                if (score === 0)
                    return null;

                // Ignore this bot
                if (message.author.id === this.client.user.id)
                    return null;

                var isMuted = (this.roles.get(this.guild.settings.muteRole));

                // Update the score
                var currentScore = this.settings.spamscore;
                this.settings.update('spamscore', currentScore + score);
                var newScore = currentScore + score;

                // Check if the score has been breached
                if (currentScore < 100 && newScore >= 100)
                {
                    console.log(`Went over 100!`);
                    if (this.spamScoreStamp === null || moment().subtract(30, 'seconds').isAfter(moment(this.spamScoreStamp)))
                    {
                        console.log(`Sent warning`);
                        var response = `:warning: <@${message.author.id}> **Please take a break for about ${moment.duration(this.guild.settings.antispamCooldown > 0 ? (currentScore / this.guild.settings.antispamCooldown) : 0, 'minutes').format("m [Minutes]")}**; your spam score is high. `;
                        if (isMuted)
                        {
                            response += `__**Ignoring this may result in getting kicked from the guild**__ and any pending bans being applied immediately.`;
                        } else if (this.guild.settings.raidMitigation >= 3)
                        {
                            response += `__**Ignoring this may result in a permanent ban**__`;
                        } else if (this.guild.settings.raidMitigation >= 2)
                        {
                            response += `**Ignoring this may result in a 1-day suspension**`;
                        } else if (this.guild.settings.raidMitigation >= 1)
                        {
                            response += `Ignoring this may result in being muted until staff manually un-mute you.`;
                        } else {
                            response += `Ignoring this may result in a 30-minute mute.`;
                        }
                        message.channel.send(response);
                        this.spamScoreStamp = moment();
                    }
                } else if (currentScore >= 100 && moment().subtract(10, 'seconds').isAfter(moment(this.spamScoreStamp)))
                {
                    console.log(`Antispam triggered!`);

                    // Reset the member's spam score
                    this.settings.update('spamscore', 0);

                    // If user is muted already, kick the user and end here
                    if (isMuted)
                    {
                        this.kick(`Triggered antispam while being muted.`);
                        return null;
                    }

                    // Issue the mute
                    if (this.guild.settings.raidMitigation < 1)
                    {
                        var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                                .setType('mute')
                                .setReason(`Triggered the antispam system and ignored the warnings by the bot.`)
                                .setDuration(30);
                        discipline.prepare()
                                .then(prepared => {
                                    prepared.finalize();
                                });
                    } else if (this.guild.settings.raidMitigation < 2)
                    {
                        var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                                .setType('mute')
                                .setReason(`Triggered the antispam system and ignored the warnings by the bot. Level 1 raid mitigation was in effect.`)
                                .setDuration(0);
                        discipline.prepare()
                                .then(prepared => {
                                    prepared.finalize();
                                });
                    } else if (this.guild.settings.raidMitigation < 3)
                    {
                        var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                                .setType('tempban')
                                .setReason(`Triggered the antispam system and ignored the warnings by the bot. Level 2 raid mitigation was in effect.`)
                                .setDuration((1 * 60 * 24));
                        discipline.prepare()
                                .then(prepared => {
                                    prepared.finalize();
                                });
                    } else if (this.guild.settings.raidMitigation >= 3)
                    {
                        var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                                .setType('ban')
                                .setReason(`Triggered the antispam system and ignored the warnings by the bot. Level 3 raid mitigation was in effect.`);
                        discipline.prepare()
                                .then(prepared => {
                                    prepared.finalize();
                                });
                    }
                }
            };
            this.xp = (score, message = null) => {

                // Ignore if score = 0
                if (score === 0)
                    return null;

                // Ignore this bot
                if (this.id === this.client.user.id)
                    return null;

                // Update the Yang
                var currentScore = this.settings.yang;
                this.settings.update('yang', currentScore + score);
                var newScore = currentScore + score;

                // Update the XP
                var currentScore = this.settings.xp;
                this.settings.update('xp', currentScore + score);
                var newScore = currentScore + score;
                var prevLevel = Math.floor(0.177 * Math.sqrt(currentScore)) + 1;
                var curLevel = Math.floor(0.177 * Math.sqrt(newScore)) + 1;

                // TODO: use settings instead of config; at this time, object role settings for some stupid f***king reason erases itself on each reboot, so we cannot use it right now

                // Level was bumped up
                if (prevLevel < curLevel)
                {
                    console.log(`Increased level!`);
                    for (var i = prevLevel + 1; i <= curLevel; i++)
                    {
                        console.log(`Level ${i}.`);
                        if (typeof config.levelRoles[i] === 'string')
                        {
                            console.log(`Role setting exists.`);
                            var role = this.guild.roles.get(config.levelRoles[i]);
                            if (role)
                            {
                                console.log(`Role exists. Adding role.`);
                                this.roles.add(role, `Achieved level ${i}`);
                                if (message !== null)
                                    message.channel.send(`:tada: **Congratulations <@${this.id}>, you earned the ${role.name} role!**`);
                            }
                        }
                    }
                }

                // Level was bumped down
                if (prevLevel > curLevel)
                {
                    console.log(`Decreased level!`);
                    for (var i = prevLevel - 1; i >= curLevel; i--)
                    {
                        console.log(`Level <${i}.`);
                        if (typeof config.levelRoles[i + 1] === 'string')
                        {
                            console.log(`Role setting exists.`);
                            var role = this.guild.roles.get(config.levelRoles[i + 1]);
                            if (role)
                            {
                                console.log(`Role exists. Removing role.`);
                                this.roles.remove(role, `Demoted role for level ${i + 1}`);
                            }
                        }
                    }
            }
            };
            this.speaking = 0;
        }

    });