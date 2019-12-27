const { Event } = require('klasa');

module.exports = class extends Event {

    async run (data) {
        // console.log(data);

        // Check for selfrole reactions (this is in the raw event because we want it to work even on uncached messages)
        if (data.t === "MESSAGE_REACTION_ADD") {
            var guild = this.client.guilds.resolve(data.d.guild_id);
            var member;
            if (guild)
                member = await guild.members.fetch(data.d.user_id);
            if (guild && member && !member.bot && data.d.channel_id === guild.settings.selfRolesChannel) {
                console.log(`Reaction was in selfRoles channel.`)
                var roles = await guild.roles.fetch();
                roles.each((role) => {
                    if (role.settings.self.message === `${data.d.channel_id}/${data.d.message_id}`) {
                        console.log(`Role ${role.id} matched reaction.`);
                        if (!member.roles.get(role.id)) {
                            member.roles.add(role, `Added self role`);
                        } else {
                            member.roles.remove(role, `Removed self role`);
                        }

                        (async (_role) => {
                            var channel = guild.channels.resolve(data.d.channel_id);
                            if (channel) {
                                var message = await channel.messages.fetch(data.d.message_id);
                                if (message) {
                                    console.log(`Message found. Finding ${_role.settings.self.reaction}`);
                                    message.reactions
                                        .map((reaction) => {
                                            console.log(`Checking ${reaction.emoji.name.codePointAt(0)}`);
                                            if (_role.settings.self.reaction === `${reaction.emoji.name}:${reaction.emoji.id}` || _role.settings.self.reaction == reaction.emoji.name.codePointAt(0)) {
                                                console.log(`Removing reaction`)
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
