const {Structures} = require('discord.js');
const moment = require("moment");
const GuildDiscipline = require('./guildDiscipline');

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

                // Ignore this bot
                if (message.author.id === this.client.user.id)
                    return null;

                // If user is already muted, do not update score, but delete any messages that scored 20 or more.
                if (message.member && message.guild && message.member.roles.get(message.guild.settings.muteRole))
                {
                    console.log(`User already muted`);
                    if (score >= 20)
                        message.delete();
                    return null;
                }

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
                        message.channel.send(`:warning: <@${message.author.id}> **Please take a 2-minute break**; your spam score is high. Continuing may result in a 30-minute mute.`);
                        this.spamScoreStamp = moment();
                    }
                } else if (currentScore >= 100 && moment().subtract(10, 'seconds').isAfter(moment(this.spamScoreStamp)))
                {
                    console.log(`Muting time!`);
                    
                    // Add 20 to the raid score of the guild
                    this.guild.raidScore(20);
                    
                    // Issue the 30 minute mute
                    var discipline = new GuildDiscipline(this.user, this.guild, this.client.user)
                            .setType('mute')
                            .setReason(`Triggered the antispam system and ignored the warnings by the bot.`)
                            .setDuration(30);
                    discipline.prepare()
                            .then(prepared => {
                                prepared.finalize();
                            });
                }
            };
        }

    });