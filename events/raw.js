const { Event } = require('klasa');

module.exports = class extends Event {

    async run (data) {
        // console.log(data);

        // Check for selfrole reactions (this is in the raw event because we want it to work even on uncached messages)
        if (data.t === "MESSAGE_REACTION_ADD") {
            var guild = this.client.guilds.resolve(data.d.guild_id);
            var member;
            var channel;
            if (guild) {
                member = await guild.members.fetch(data.d.user_id);
                channel = guild.channels.resolve(guild.settings.selfRolesChannel);
            }
            if (guild && member && data.d.user_id !== this.client.user.id && data.d.channel_id === guild.settings.selfRolesChannel) {
                var roles = await guild.roles.fetch();
                roles.each((role) => {
                    if (role.settings.self.message === `${data.d.channel_id}/${data.d.message_id}` && (role.settings.self.reaction === `${data.d.emoji.name}:${data.d.emoji.id}` || role.settings.self.reaction == data.d.emoji.name.codePointAt(0))) {
                        if (!member.roles.get(role.id)) {
                            member.roles.add(role, `Added self role`);
                            if (channel && member) {
                                member.spamScore(5);
                                channel.send(`:white_check_mark: <@${member.id}>, the ${role.name} role was **added** to you.`)
                                .then((msg) => {
                                    setTimeout(() => {
                                        msg.delete();
                                    }, 5000);
                                });
                            }
                        } else {
                            member.roles.remove(role, `Removed self role`);
                            if (channel && member) {
                                member.spamScore(5);
                                channel.send(`:white_check_mark: <@${member.id}>, the ${role.name} role was **removed** from you.`)
                                .then((msg) => {
                                    setTimeout(() => {
                                        msg.delete();
                                    }, 5000);
                                });
                            }
                        }

                        (async (_role) => {
                            var channel = guild.channels.resolve(data.d.channel_id);
                            if (channel) {
                                var message = await channel.messages.fetch(data.d.message_id);
                                if (message) {
                                    message.reactions
                                        .map((reaction) => {
                                            if (_role.settings.self.reaction === `${reaction.emoji.name}:${reaction.emoji.id}` || _role.settings.self.reaction == reaction.emoji.name.codePointAt(0)) {
                                                reaction.users.remove(data.d.user_id);
                                            }
                                        })
                                }
                            }
                        })(role);
                    }
                });
            }
        }
    }

};
