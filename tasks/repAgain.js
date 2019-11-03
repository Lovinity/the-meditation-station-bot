const { Task } = require('klasa');

module.exports = class extends Task {

    async run ({ guild, user }) {
        const _guild = this.client.guilds.resolve(guild);
        if (_guild) {
            const _user = this.client.users.resolve(user);
            if (_user) {
                await _user.guildSettings(guild).update(`canRep`, true);
            }
        }
    }

};