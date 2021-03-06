const { Task } = require('klasa');

module.exports = class extends Task {

    async run ({ guild, user }) {
        const _guild = this.client.guilds.resolve(guild);
        if (_guild) {
            const _user = await this.client.users.fetch(user);
            if (_user) {
                var settings = await _user.guildSettings(guild.id);
                await settings.update(`canRep`, true);
            }
        }
    }

};