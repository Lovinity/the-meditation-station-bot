const {Event} = require('klasa');
const {MessageEmbed} = require('discord.js');
const moment = require("moment");
module.exports = class extends Event {

    run(message) {
        if (message.command && message.command.deletable)
            for (const msg of message.responses)
                msg.delete();
        // Skip the bot
        if (message.author.id === this.client.user.id)
            return;

        // Remove XP/Yang
        if (typeof message.member !== 'undefined')
        {
            var xp = 0 - message.earnedXp;
            message.member.xp(xp, message);
            message.earnedXp = 0;
        }

        // Remove good rep
        if (message.member && !message.author.bot)
        {
            var removeRep = false;
            message.reactions
                    .each((reaction) => {
                        if (reaction.me)
                            removeRep = true;
                    });

            if (removeRep)
            {
                message.reactions
                        .filter((reaction) => reaction.emoji.id === message.guild.settings.repEmoji && !reaction.me)
                        .each((reaction) => {
                            message.member.settings.update('goodRep', message.member.settings.goodRep - 1);
                        });
            }
        }

        // Get the configured modLog channel.
        const modLog = message.guild.settings.eventLogChannel;

        // End if there is no configured channel
        if (!modLog)
            return;

        var display = new MessageEmbed()
                .setTitle(`Deleted Message`)
                .setDescription(`${message.cleanContent}`)
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setFooter(`Message created **${message.createdAt}** in channel **${message.channel.name}**`);

        const _channel = this.client.channels.resolve(modLog);

        // Write attachment URLs
        message.attachments.array().map((attachment) => {
            display.addField(`Contained Attachment`, JSON.stringify(attachment));
        });
        // Write embeds as JSON
        message.embeds.map((embed) => {
            display.addField(`Contained Embed`, JSON.stringify(embed));
        });

        _channel.sendEmbed(display, `:wastebasket: A message ${message.id} was deleted.`);


    }

};

