// This task removes a mute when expired

const { Task } = require('klasa');

module.exports = class extends Task {

    async run ({ user, guild, role, caseID }) {
        // Get the user
        const _user = this.client.users.resolve(user);
        if (_user) {
            const _guild = this.client.guilds.resolve(guild);
            if (_guild) {
                const _role = _guild.roles.resolve(role);
                if (_role) {
                    // Remove the muted role
                    const _guildMember = _guild.members.resolve(user);
                    if (_guildMember) {
                        _guildMember.roles.remove(_role, `Mute expired`);
                    }
                }

                var settings = await _user.guildSettings(_guild.id);
                settings.update(`muted`, false, _guild);

                const logchannel = _guild.channels.resolve(_guild.settings.modLogChannel);

                if (logchannel) {
                    logchannel.send(`:loud_sound: The mute for ${_user.tag} has expired.`);
                }

                // Announce in the incidents channel that the mute is expired
                _guild.channels.cache
                    .filter((channel) => channel.name === `discipline-${caseID}`)
                    .each((channel) => {
                        channel.send(`:loud_sound: Your mute has expired.`);
                    });
            }
        }
    }

};


