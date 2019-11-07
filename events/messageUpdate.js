const { Event } = require('klasa');
const { MessageEmbed } = require('discord.js');
var jsdiff = require('diff');
const moment = require("moment");

module.exports = class extends Event {

    async run (old, message) {
        // First, update spam score if new score is bigger than old score. Do NOT update if new score is less than old score; we don't want to lower it.
        try {
            if (message.type === 'DEFAULT' && typeof message.member !== 'undefined' && message !== null) {
                var oldscore = old.earnedSpamScore;
                var newscore = await message.spamScore;
                message.earnedSpamScore = newscore;
                if (newscore > oldscore) {
                    var diff = newscore - oldscore;
                    message.member.spamScore(diff, message);
                }
            }

            // Update XP/Yang; remove all reputation and reactions as the message has been edited.
            if (typeof message.member !== 'undefined') {
                message.reactions.removeAll();
                var xp1 = old.earnedXp;
                var xp2 = message.xp;
                if (spamScore > message.guild.settings.antispamCooldown) {
                    xp2 = 0;
                } else if (message.member && !message.author.bot && xp2 >= 2) {
                    message.react(message.guild.settings.repEmoji);
                }
                message.earnedXp = xp2;
                if (xp2 - xp1 !== 0) {
                    message.member.xp(xp2 - xp1, message);
                }
            }
        } catch (e) {
            this.client.emit('error', e);
        }

        if (this.client.ready && old.content !== message.content)
            this.client.monitors.run(message);

        // Skip the bot
        if (message.author.id === this.client.user.id)
            return;

        // Get the configured modLog channel.
        const modLog = message.guild.settings.eventLogChannel;

        // End if there is no configured channel
        if (!modLog)
            return;

        var display = new MessageEmbed()
            .setTitle(`Old Message`)
            .setDescription(`${old.cleanContent}`)
            .setAuthor(message.author.tag, message.author.displayAvatarURL())
            .setFooter(`Message created **${message.createdAt}** in channel **${message.channel.name}**`);

        const _channel = this.client.channels.resolve(modLog);

        // First, determine any attachment changes
        var oldAttachments = [];
        var newAttachments = [];

        old.attachments.array().map((attachment) => {
            oldAttachments.push(attachment.url);
        });

        message.attachments.array().map((attachment) => {
            newAttachments.push(attachment.url);
        });

        oldAttachments.map((attachment) => {
            if (newAttachments.indexOf(attachment.url) === -1)
                display.addField(`Attachment removed`, JSON.stringify(attachment));
        });

        newAttachments.map((attachment) => {
            if (oldAttachments.indexOf(attachment.url) === -1)
                display.addField(`Attachment added`, JSON.stringify(attachment));
        });

        // Next, determine embed changes

        var oldEmbeds = [];
        var newEmbeds = [];

        old.embeds.map((embed) => {
            oldEmbeds.push(JSON.stringify(embed));
        });

        message.embeds.map((embed) => {
            newEmbeds.push(JSON.stringify(embed));
        });

        oldEmbeds.map((embed) => {
            if (newEmbeds.indexOf(embed) === -1)
                display.addField(`Embed removed`, embed);
        });

        newEmbeds.map((embed) => {
            if (oldEmbeds.indexOf(embed) === -1)
                display.addField(`Embed added`, embed);
        });

        // Get the differences between old and new content
        var diff = jsdiff.diffSentences(old.cleanContent, message.cleanContent);
        diff.map(function (part) {
            if (part.added) {
                display.addField(`Part added`, part.value);
            } else if (part.removed) {
                display.addField(`Part removed`, part.value);
            }
        });

        // send a log to the channel
        _channel.sendEmbed(display, `:pencil: Message ${message.id} was edited.`);



    }

};


