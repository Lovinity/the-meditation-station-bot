const { Event } = require('klasa');
const { MessageEmbed } = require("discord.js");

module.exports = class extends Event {

    async run (reaction, user) {

        // Fetch partials
        if (reaction.partial) await reaction.partial.fetch();
        if (reaction.message.partial) await reaction.message.fetch();
        if (user.partial) await user.fetch();

        if (!reaction.message.member)
            return null;

        var reactionMember = reaction.message.guild.members.resolve(user);

        // Add rep if this is a rep earning message
        if (user.id !== this.client.user.id && reaction.emoji.id === reaction.message.guild.settings.repEmoji) {
            var addRep = reaction.me;

            // Make sure this user can actually give reputation
            if (reactionMember && addRep && reaction.message.author.id !== user.id) {
                if (!reactionMember.settings.restrictions.cannotGiveReputation && !user.bot) {
                    reaction.message.member.settings.update(`goodRep`, reaction.message.member.settings.goodRep + 1);
                } else {
                    reactionMember.spamScore(25);
                    var _msg = await reaction.message.send(`:lock: Sorry <@${user.id}>, but staff have forbidden you from being able to give good reputation to other members.`);
                    setTimeout(() => {
                        _msg.delete();
                    }, 10000);
                    reaction.users.remove(user);
                }
            } else {
                reaction.users.remove(user);
                if (reaction.message.author.id === user.id) {
                    var _msg = await reaction.message.send(`:lock: Sorry <@${user.id}>, but you can't give good reputation to yourself.`);
                    setTimeout(() => {
                        _msg.delete();
                    }, 10000);
                    reaction.message.member.spamScore(10);
                } else if (!addRep) {
                    var _msg = await reaction.message.send(`:lock: Sorry <@${user.id}>, but that message does not qualify for good reputation..`);
                    setTimeout(() => {
                        _msg.delete();
                    }, 10000);
                    reaction.message.member.spamScore(10);
                }
            }

            // Starboard (via rep emoji)
            const msg = await reaction.message;
            const { guild } = msg;
            const starChannel = guild.channels.resolve(guild.settings.starboardChannel);
            var reactionCount = 0;
            if (guild && guild.settings.repEmoji && starChannel) {
                var msgReactions = msg.reactions.resolve(guild.settings.repEmoji);
                if (msgReactions) {
                    var reactionUsers = await msgReactions.users.fetch();
                    if (reactionUsers) {
                        reactionUsers.map((reactionUser) => {
                            if (reactionUser.id !== this.client.user.id && !reactionUser.bot && msg.author.id !== reactionUser.id) {
                                var reactionMember = guild.members.resolve(reactionUser);
                                if (reactionMember) {
                                    if (!reactionMember.settings.restrictions.cannotGiveReputation) {
                                        reactionCount++;
                                    }
                                }
                            }
                        })
                    }
                }
            }

            if (guild && starChannel && reactionCount >= guild.settings.starboardRequired) {
                if (starChannel && starChannel.postable && starChannel.embedable && !msg.channel.nsfw) {
                    const fetch = await starChannel.messages.fetch({ limit: 100 });
                    const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(msg.id));

                    const jumpString = `[View The Original Message](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})\n`;

                    if (starMsg) {
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
    }

    checkAttachments (attachment) {
        const imageLink = attachment.split(".");
        const typeOfImage = imageLink[ imageLink.length - 1 ];
        const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
        if (!image) return null;
        return attachment;
    }
};


