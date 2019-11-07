const { Event } = require('klasa');
const { MessageEmbed } = require("discord.js");

module.exports = class extends Event {

    async run (reaction, user) {
        if (!reaction.message.member)
            return null;

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
            const noRep = reaction.message.guild.settings.noRep
            const noRepRole = reaction.message.guild.roles.resolve(noRep)
            if (removeRep && !user.bot && reaction.message.author.id !== user.id && reaction.emoji.id === reaction.message.guild.settings.repEmoji && (!noRepRole || !reaction.message.member.roles.get(noRepRole.id))) {
                console.log(`Remove rep`);
                reaction.message.member.settings.update(`goodRep`, reaction.message.member.settings.goodRep - 1);
            }
        }

        // Starboard
        const msg = reaction.message;
        const { guild } = msg;
        if (guild && reaction.emoji.name === "â­" && guild.settings.starboardChannel) {

            const starChannel = msg.guild.channels.get(msg.guild.settings.starboardChannel);
            if (starChannel && starChannel.postable && starChannel.embedable && !msg.channel.nsfw) {

                const fetch = await starChannel.messages.fetch({ limit: 100 });
                const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("â­") && m.embeds[ 0 ].footer.text.endsWith(msg.id));

                const jumpString = `[â–º View The Original Message](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})\n`;

                if (starMsg) {
                    const starEmbed = starMsg.embeds[ 0 ];
                    const image = msg.attachments.size > 0 ? await this.checkAttachments(msg.attachments.array()[ 0 ].url) : null;

                    const embed = new MessageEmbed()
                        .setColor(starEmbed.color)
                        .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
                        .setTimestamp(new Date(msg.createdTimestamp))
                        .setFooter(`â­ ${msg.reactions.get("â­") ? msg.reactions.get("â­").count : 0} | ${msg.id}`);

                    if (image) embed.setImage(image);
                    if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
                    else embed.setDescription(jumpString);

                    const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);
                    if (oldMsg && oldMsg.author.id === this.client.user.id) {
                        if (!msg.reactions.get("â­")) {
                            await oldMsg.delete();
                        } else {
                            await oldMsg.edit({ embed });
                        }
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


