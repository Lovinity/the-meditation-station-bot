const { Event } = require('klasa');
const GuildDiscipline = require('../util/guildDiscipline');

module.exports = class extends Event {

    async run (message) {
        if (message.type === 'DEFAULT' && typeof message.member !== 'undefined' && message !== null) {

            // Self bot detection: regular members cannot add embeds immediately on message creation. Safe to assume this is hard evidence of a self bot. We can pursue action immediately.
            if (message.embeds.length > 0 && !message.author.bot) {
                var discipline = new GuildDiscipline(message.author, message.guild, message.client.user)
                    .setType('classG')
                    .setReason(`Self-Bot Detection: An embed was detected on a message you sent (ID: ${message.id}). Regular members cannot create embeds on their own without using a bot or script (which is against Discord's Terms). This incident will be reported to Discord for investigation.`)
                    .addRule(message.guild.settings.selfBotsRuleNumber);
                discipline.prepare()
                    .then(prepared => {
                        prepared.finalize();
                    });
            }

            // Spam scoring
            try {
                var spamScore = await message.spamScore;
                message.earnedSpamScore = spamScore;
                message.member.spamScore(spamScore, message);
                if (spamScore <= message.guild.settings.antispamCooldown) {
                    var xp = message.xp;
                    message.earnedXp = xp;
                    message.member.xp(xp, message);

                    // Activate reputation earning if XP score is at least 2
                    if (message.member && !message.author.bot && xp >= 2) {
                        message.react(message.guild.settings.repEmoji);
                    }
                }
            } catch (e) {
            }
        }

        if (this.client.ready) this.client.monitors.run(message);
    }

};



