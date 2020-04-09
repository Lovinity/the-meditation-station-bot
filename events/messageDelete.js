const { Event } = require('klasa');
const { MessageEmbed } = require('discord.js');
const moment = require("moment");
module.exports = class extends Event {

    async run (message) {

        // If the message is a partial, we can't do anything.
        if (message.partial) {
            const owner = this.client.application.owner;
            if (owner) {
                owner.send(`:question: Partial message ${message.id} was deleted.`);
            }
            return;
        }

        // Delete command message too if deletable
        if (message.command && message.command.deletable)
            for (const msg of message.responses)
                msg.delete();

        // Skip the bot
        if (message.author.id === this.client.user.id)
            return;

        // Find out who deleted the message
        const fetchedLogs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: 'MESSAGE_DELETE',
        });
        var auditLog = fetchedLogs.entries.first();
        if (!auditLog || auditLog.target.id !== message.author.id)
            auditLog = undefined;

        // Remove XP/Yang
        if (typeof message.member !== 'undefined' && message.member !== null) {
            var xp = 0 - message.earnedXp;
            message.member.xp(xp, message);
            message.earnedXp = 0;
        }

        // Remove all good rep earned from reactions, if any.
        if (!message.author.bot) {
            var removeRep = false;
            message.reactions
                .each((_reaction) => {
                    if (_reaction.me && _reaction.emoji.id === _reaction.message.guild.settings.repEmoji)
                        removeRep = true;
                });

            if (removeRep) {
                message.reactions
                    .filter((reaction) => reaction.emoji.id === reaction.message.guild.settings.repEmoji && reaction.message.author.id !== message.author.id)
                    .each((reaction) => {
                        reaction.users.each((reactionUser) => {
                            reactionUser.guildSettings(message.guild.id)
                                .then((settings) => {
                                    if (!reactionUser.bot && !settings.restrictions.cannotGiveReputation)
                                        message.member.settings.update('goodRep', message.member.settings.goodRep - 1);
                                });
                        });
                    });
            }
        }

        // Remove all starboard
        const { guild } = message;
        if (guild && guild.settings.starboardChannel) {

            const starChannel = message.guild.channels.resolve(message.guild.settings.starboardChannel);
            if (starChannel) {
                const fetch = await starChannel.messages.fetch({ limit: 100 });
                const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(message.id));
                if (starMsg) {
                    const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);
                    await oldMsg.delete();
                }
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

        _channel.sendEmbed(display, `:wastebasket: Message ${message.id} was deleted${auditLog ? ` by ${auditLog.executor.tag} (${auditLog.executor.id})` : ``}.`);


    }

};

