const { Event } = require('klasa');
const GuildDiscipline = require('../util/guildDiscipline');

module.exports = class extends Event {

    async run (message) {
        if (message.type === 'DEFAULT' && message !== null && message.member !== null && typeof message.member !== 'undefined') {

            // Spam scoring
            try {
                var spamScore = await message.spamScore;
                message.earnedSpamScore = spamScore;
                message.member.spamScore(spamScore, message);
                if (spamScore <= message.guild.settings.antispamCooldown && !message.member.settings.muted) {
                    var xp = message.xp;
                    message.earnedXp = xp;
                    message.member.xp(xp, message);

                    // Activate reputation earning if XP score is at least 2
                    if (message.member && !message.author.bot && xp >= 2) {
                        message.react(message.guild.settings.repEmoji);
                    }
                }
            } catch (e) {
                this.client.emit('error', e);
            }

            if (this.client.ready) this.client.monitors.run(message);
        } else if (message.type === 'DEFAULT' && message.guild === null && !message.author.bot) {
            return message.send(`Well hi there! Sorry but I don't know what to say in DMs. Please use bot commands in a guild. Thanks!`);
        }
    }

};



