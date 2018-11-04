// This task removes a mute when expired

const {Task} = require('klasa');

module.exports = class extends Task {

    async run( { user, guild, role, incidentsChannel }) {
        // Get the user
        const _user = this.client.users.get(user);
        if (_user)
        {
            // Remove the role from the user's database
            _user.guildSettings(guild).update(`roles`, role, {action: 'remove'});

            const _guild = this.client.guilds.get(guild);
            if (_guild)
            {
                // Remove the muted role
                const _role = _guild.roles.get(role);
                if (_role)
                {
                    const _guildMember = _guild.members.get(user);
                    if (_guildMember)
                    {
                        _guildMember.roles.remove(_role, `Mute expired`);
                    }
                }

                const logchannel = _guild.channels.get(_guild.settings.modLogChannel);

                if (logchannel)
                {
                    logchannel.send(`:loud_sound: The mute for ${_user.tag} has expired.`);
                }

                // Announce in the inbcidents channel that the mute is expired
                if (incidentsChannel !== null)
                {
                    const channel = _guild.channels.get(incidentsChannel);
                    if (channel)
                    {
                        channel.send(`:loud_sound: Your mute has now expired. Thank you for your patience and understanding.`);
                    }
                }
            }
    }
    }

};


