const { Event } = require('klasa');
const moment = require("moment");

module.exports = class extends Event {

    async run (messages) {
        var modLog;

        // Delete command messages too if deletable
        for (const message of messages) {
            
            // Skip partials
            if (message.partial) continue;

            if (message.command && message.command.deletable)
                for (const msg of message.responses)
                    msg.delete();
        }

        var data = ``;
        messages.array().sort(function (a, b) {
            return a.id - b.id;
        }).map((message) => {

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

                const starChannel = message.guild.channels.get(message.guild.settings.starboardChannel);
                if (starChannel) {
                    (async (_starChannel) => {
                        const fetch = await starChannel.messages.fetch({ limit: 100 });
                        const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(message.id));
                        if (starMsg) {
                            const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);
                            await oldMsg.delete();
                        }
                    })(starChannel);
                }
            }

            // Get the configured modLog channel.
            if (!modLog) {
                if (typeof message.guild !== 'undefined')
                    modLog = message.guild.settings.eventLogChannel;
            }

            // Write each message to data
            data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}, channel ${message.channel.name}+++\n`;
            data += `-Time: ${moment(message.createdAt).format()}\n`;
            // Write attachment URLs
            message.attachments.array().map((attachment) => {
                data += `-Attachment: ${attachment.url}\n`;
            });
            // Write embeds as JSON
            message.embeds.forEach((embed) => {
                data += `-Embed: ${JSON.stringify(embed)}\n`;
            });
            // Write the clean version of the message content
            data += `${message.cleanContent}\n\n\n`;
        });

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.resolve(modLog);

        // Create a buffer with the data
        var buffer = new Buffer(data, "utf-8");

        // Send the buffer to the staff channel as a txt file
        _channel.send(`:wastebasket: :wastebasket: Multiple messages were deleted in bulk.`, { files: [ { attachment: buffer, name: `bulkDelete_${moment().valueOf()}.txt` } ] });
    }

};


