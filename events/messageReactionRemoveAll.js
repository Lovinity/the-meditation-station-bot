const { Event } = require('klasa');
const { MessageEmbed } = require("discord.js");

module.exports = class extends Event {

    async run (message) {
        
        // Upgrade partial messages to full messages
        if (message.partial) {
            await message.fetch();
        }

        if (!message.member)
            return null;

        if (!message.author.bot) {
            // Remove all good rep earned from reactions, if any.
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
        const msg = message;
        const { guild } = msg;
        if (guild && guild.settings.starboardChannel) {

            const starChannel = msg.guild.channels.resolve(msg.guild.settings.starboardChannel);
            if (starChannel) {
                const fetch = await starChannel.messages.fetch({ limit: 100 });
                const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(msg.id));
                if (starMsg) {
                    const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);
                    await oldMsg.delete();
                }
            }
        }
    }
};