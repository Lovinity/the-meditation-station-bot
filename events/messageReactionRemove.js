const { Event } = require('klasa');
const { MessageEmbed } = require("discord.js");

module.exports = class extends Event {

    async run (reaction, user) {
        if (!reaction.message.member)
            return null;

        const noRep = reaction.message.guild.settings.noRep
        const noRepRole = reaction.message.guild.roles.resolve(noRep)

        // Remove earned rep if necessary
        if (reaction.message.author.id !== this.client.user.id) {
            console.log(`Rep removing`);
            var removeRep = false;
            reaction.message.reactions
                .each((reaction) => {
                    if (reaction.me)
                        removeRep = true;
                });

            // Make sure those with the noRep role cannot remove reputation
            if (removeRep && !user.bot && reaction.message.author.id !== user.id && reaction.emoji.id === reaction.message.guild.settings.repEmoji && (!noRepRole || !reaction.message.member.roles.get(noRepRole.id))) {
                console.log(`Remove rep`);
                reaction.message.member.settings.update(`goodRep`, reaction.message.member.settings.goodRep - 1);
            }
        }

        // Starboard (via rep emoji)
        const msg = reaction.message;
        const { guild } = msg;
        const starChannel = guild.channels.get(guild.settings.starboardChannel);
        var reactionCount = 0;
        if (guild && guild.settings.repEmoji && starChannel) {
            var msgReactions = msg.reactions.resolve(guild.settings.repEmoji);
            if (msgReactions) {
                msgReactions.users.each((reactionUser) => {
                    if (reactionUser.id !== this.client.user.id && !reactionUser.bot && reaction.message.author.id !== reactionUser.id) {
                        var reactionMember = guild.members.resolve(user);
                        if (reactionMember) {
                            if (!noRepRole || !reactionMember.roles.get(noRepRole.id)) {
                                reactionCount++;
                            }
                        }
                    }
                })
            }
        }
        if (guild && starChannel && reactionCount >= guild.settings.starboardRequired) {
            console.log(`starboard`)
            if (starChannel && starChannel.postable && starChannel.embedable && !msg.channel.nsfw) {
                console.log(`Starboard valid`)
                const fetch = await starChannel.messages.fetch({ limit: 100 });
                const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(msg.id));

                const jumpString = `[â–º View The Original Message](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})\n`;

                if (starMsg) {
                    console.log(`Star message found`)
                    const starEmbed = starMsg.embeds[ 0 ];
                    const image = msg.attachments.size > 0 ? this.checkAttachments(msg.attachments.array()[ 0 ].url) : null;

                    const embed = new MessageEmbed()
                        .setColor(starEmbed.color)
                        .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
                        .setTimestamp(new Date(msg.createdTimestamp))
                        .setFooter(`REP: +${reactionCount} | ${msg.id}`);
                    if (image) embed.setImage(image);
                    if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
                    else embed.setDescription(jumpString);

                    const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);

                    if (oldMsg && oldMsg.author.id === this.client.user.id)
                        await oldMsg.edit({ embed });
                } else {
                    console.log(`Star message not found; use new message`);
                    const image = msg.attachments.size > 0 ? this.checkAttachments(msg.attachments.array()[ 0 ].url) : null;
                    if (image || msg.content) {
                        const embed = new MessageEmbed()
                            .setColor(15844367)
                            .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
                            .setTimestamp(new Date(msg.createdTimestamp))
                            .setFooter(`REP: +${reactionCount} | ${msg.id}`);
                        if (image) embed.setImage(image);
                        if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
                        else embed.setDescription(jumpString);

                        await starChannel.send({ embed });
                    }
                }
            }
        } else if (guild && starChannel) {
            const fetch = await starChannel.messages.fetch({ limit: 100 });
            const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(msg.id));
            if (starMsg) {
                const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);

                if (oldMsg && oldMsg.author.id === this.client.user.id)
                    await oldMsg.delete(`Starboard message no longer qualifies to be on the starboard.`);
            }
        }
    }

    checkAttachments (attachment) {
        const imageLink = attachment.split(".");
        const typeOfImage = imageLink[ imageLink.length - 1 ];
        const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
        if (!image) return null;
        return attachment;
    }
};


