// This task removes a tempban when expired

const {Task} = require('klasa');

module.exports = class extends Task {

    async run( { user, guild, incidentsChannel }) {
        // Get the user
        const _user = this.client.users.get(user);
        if (_user)
        {

            const _guild = this.client.guilds.get(guild);
            if (_guild)
            {
                // Remove the ban
                await _guild.members.unban(_user, `Temporary ban expired.`);
                
                const logchannel = _guild.channels.get(_guild.settings.get('modLogChannel'));

                if (logchannel)
                {
                    logchannel.send(`:speech_left: The temporary ban for ${_user.tag} has expired.`);
                }

                // Announce in the inbcidents channel that the mute is expired
                if (incidentsChannel !== null)
                {
                    const channel = _guild.channels.get(incidentsChannel);
                    if (channel)
                    {
                        channel.send(`:speech_left: Your temp ban has expired.`);
                    }
                }
            }
    }
    }

};


