const { Event } = require('klasa');
const { MessageEmbed } = require("discord.js");

module.exports = class extends Event {

    async run (reaction, user) {
        if (!reaction.message.member)
            return null;

        // Add rep if this is a rep earning message
        if (reaction.message.author.id !== this.client.user.id && !user.bot && reaction.message.author.id !== user.id && reaction.emoji.id === reaction.message.guild.settings.repEmoji) {
            console.log(`Rep earning`);
            var addRep = false;
            reaction.message.reactions
                .each((reaction) => {
                    if (reaction.me)
                        addRep = true;
                });

            // Make sure those with the noRep role cannot add reputation
            const noRep = reaction.message.guild.settings.noRep
            const noRepRole = reaction.message.guild.roles.resolve(noRep)
            if (addRep && !user.bot && (!noRepRole || !reaction.message.member.roles.get(noRepRole.id))) {
                console.log(`Add rep`);
                reaction.message.member.settings.update(`goodRep`, reaction.message.member.settings.goodRep + 1);
            }
        }

        // Starboard
        const msg = reaction.message;
        const { guild } = msg;
        if (guild && reaction.emoji.name === "â­" && guild.settings.starboardChannel && msg.reactions.get("â­").count >= guild.settings.starboardRequired) {

            const starChannel = msg.guild.channels.get(msg.guild.settings.starboarChannel);
            if (starChannel && starChannel.postable && starChannel.embedable && !msg.channel.nsfw) {
                const fetch = await starChannel.messages.fetch({ limit: 100 });
                const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("â­") && m.embeds[ 0 ].footer.text.endsWith(msg.id));

                const jumpString = `[â–º View The Original Message](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})\n`;

                if (starMsg) {
                    const starEmbed = starMsg.embeds[ 0 ];
                    const image = msg.attachments.size > 0 ? this.checkAttachments(msg.attachments.array()[ 0 ].url) : null;

                    const embed = new MessageEmbed()
                        .setColor(starEmbed.color)
                        .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
                        .setTimestamp(new Date(msg.createdTimestamp))
                        .setFooter(`â­ ${msg.reactions.get("â­").count} | ${msg.id}`);
                    if (image) embed.setImage(image);
                    if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
                    else embed.setDescription(jumpString);

                    const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);

                    if (oldMsg && oldMsg.author.id === this.client.user.id)
                        await oldMsg.edit({ embed });
                } else {
                    const image = msg.attachments.size > 0 ? this.checkAttachments(msg.attachments.array()[ 0 ].url) : null;
                    if (image || msg.content) {
                        const embed = new MessageEmbed()
                            .setColor(15844367)
                            .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
                            .setTimestamp(new Date(msg.createdTimestamp))
                            .setFooter(`â­ ${msg.reactions.get("â­").count} | ${msg.id}`);
                        if (image) embed.setImage(image);
                        if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
                        else embed.setDescription(jumpString);

                        await starChannel.send({ embed });
                    }
                }
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


