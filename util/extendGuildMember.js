const { Structures } = require('discord.js');
const moment = require("moment");
require("moment-duration-format");
const GuildDiscipline = require('./guildDiscipline');
const config = require("../config");

Structures.extend('GuildMember', GuildMember => class MyGuildMember extends GuildMember {

    constructor(...args) {
        super(...args);
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
            var currentScore = this.settings.spamScore;
            this.settings.update('spamScore', currentScore + score);
            var newScore = currentScore + score;

            // Check if the score has been breached
            if (currentScore < 100 && newScore >= 100) {
                console.log(`Went over 100!`);
                if (this.spamScoreStamp === null || moment().subtract(60, 'seconds').isAfter(moment(this.spamScoreStamp))) {
                    console.log(`Sent warning`);
                    var response = `:warning: <@${message.author.id}> **__Antispam__: You're being a bit rowdy. Please take a break from sending messages for about ${moment.duration(this.guild.settings.antispamCooldown > 0 ? (newScore / this.guild.settings.antispamCooldown) + 1 : 0, 'minutes').format("m [Minutes]")}**. `;
                    if (isMuted) {
                        response += `**Otherwise, I'll have to kick you from the guild, causing any pending bans to apply and you to lose any opportunity to appeal active discipline**.`;
                    } else if (this.guild.settings.raidMitigation >= 3) {
                        response += `__**Otherwise, I'll have to permanently ban you.**__`;
                    } else if (this.guild.settings.raidMitigation >= 2) {
                        response += `**Otherwise, I'll have to temp ban you for 24 hours.**`;
                    } else if (this.guild.settings.raidMitigation >= 1) {
                        response += `Otherwise, I'll have to mute you until staff manually unmute you.`;
                    } else {
                        response += `Otherwise, I'll have to mute you for 30 minutes.`;
                    }
                    message.send(response);
                    this.spamScoreStamp = moment();
                }
            } else if (currentScore >= 100 && moment().subtract(10, 'seconds').isAfter(moment(this.spamScoreStamp))) {
                console.log(`Antispam triggered!`);

                // Reset the member's spam score
                this.settings.update('spamScore', 0);

                // If user is muted already, kick the user and end here
                if (isMuted) {
                    this.kick(`Triggered antispam while being muted.`);
                    return null;
                }

                // Determine if a mute should be untimed based on bad Reputation
                var badRepThreshold = (this.settings.badRep >= 90 && this.settings.badRep < 100) || (this.settings.badRep >= 140 && this.settings.badRep < 150) || (this.settings.badRep >= 190 && this.settings.badRep < 200) || (this.settings.badRep >= 240 && this.settings.badRep < 250) || (this.settings.badRep >= 290 && this.settings.badRep < 300)

                // Issue the mute
                if (this.guild.settings.raidMitigation < 1 && !badRepThreshold) {
                    var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                        .setType('mute')
                        .setReason(`Triggered the antispam system and ignored the warnings by the bot.`)
                        .setDuration(30)
                        .setYang(100)
                        .setReputation(10);
                    discipline.prepare()
                        .then(prepared => {
                            prepared.finalize();
                        });
                } else if (this.guild.settings.raidMitigation < 1 && badRepThreshold) {
                    var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                        .setType('mute')
                        .setReason(`Triggered the antispam system and ignored the warnings by the bot. Bad reputation has reached potential ban level, which will be determined by staff.`)
                        .setDuration(0)
                        .setYang(100)
                        .setReputation(10);
                    discipline.prepare()
                        .then(prepared => {
                            prepared.finalize();
                        });
                } else if (this.guild.settings.raidMitigation < 2) {
                    var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                        .setType('mute')
                        .setReason(`Triggered the antispam system and ignored the warnings by the bot. Level 1 raid mitigation was in effect.`)
                        .setDuration(0)
                        .setYang(100)
                        .setReputation(10);
                    discipline.prepare()
                        .then(prepared => {
                            prepared.finalize();
                        });
                } else if (this.guild.settings.raidMitigation < 3) {
                    var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                        .setType('tempban')
                        .setReason(`Triggered the antispam system and ignored the warnings by the bot. Level 2 raid mitigation was in effect.`)
                        .setDuration((1 * 60 * 24));
                    discipline.prepare()
                        .then(prepared => {
                            prepared.finalize();
                        });
                } else if (this.guild.settings.raidMitigation >= 3) {
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

            // Ignore this bot and all other bots; no XP for them
            if (this.id === this.client.user.id || this.user.bot)
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

            // Update activity score
            var currentActivity = this.settings.activityScore;
            this.settings.update('activityScore', currentActivity + score);

            // TODO: use settings instead of config; at this time, object role settings for some stupid f***king reason erases itself on each reboot, so we cannot use it right now

            // Level was bumped up
            if (prevLevel < curLevel) {
                console.log(`Increased level!`);
                var levelRole = this.guild.settings.levelRoles[ `level${curLevel}` ];
                if (levelRole && levelRole !== null && this.guild.roles.has(levelRole) && !this.roles.has(levelRole)) {
                    this.roles.add(levelRole, `Achieved level ${curLevel}`);
                    if (message !== null) {
                        message.send(`:tada: **Congratulations <@${this.id}>, you earned the ${levelRole.name} role!**`);
                    } else {
                        var channel = this.guild.settings.generalChannel;
                        var _channel = this.guild.channels.resolve(channel);
                        if (_channel)
                            _channel.send(`:tada: **Congratulations <@${this.id}>, you earned the ${levelRole.name} role!**`);
                    }
                }
            }

            // Level was bumped down. Do a full level role update for these, just to be sure
            if (prevLevel > curLevel) {
                // Update level roles
                var levelRoles = {};
                var levelRoles2 = this.guild.settings.levelRoles;
                for (var key in levelRoles2) {
                    if (levelRoles2.hasOwnProperty(key)) {
                        if (levelRoles2[ key ] === null)
                            continue;
                        levelRoles[ key.replace('level', '') ] = levelRoles2[ key ];
                    }
                }
                var levelKeys = Object.keys(levelRoles);
                if (levelKeys.length > 0) {
                    var rolesToAdd = [];
                    var rolesToRemove = [];
                    levelKeys.map(levelKey => {
                        var xp = Math.ceil(((levelKey - 1) / 0.177) ** 2);
                        if (this.guild.roles.has(levelRoles[ levelKey ])) {
                            if (this.settings.xp >= xp && !this.roles.has(levelRoles[ levelKey ])) {
                                rolesToAdd.push(levelRoles[ levelKey ]);
                            } else if (this.settings.xp < xp && this.roles.has(levelRoles[ levelKey ])) {
                                rolesToRemove.push(levelRoles[ levelKey ]);
                            }
                        }
                    });

                    if (rolesToAdd.length > 0)
                        this.roles.add(rolesToAdd, `Level Update (add roles)`)
                            .then(stuff => {
                                if (rolesToRemove.length > 0)
                                    this.roles.remove(rolesToRemove, `Level Update (remove roles)`);
                            });
                }
            }
        };
        this.speaking = 0;
    }

});