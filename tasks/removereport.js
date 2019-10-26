// This task removes an individual !report use from the database because the use expired.

const {Task} = require('klasa');

module.exports = class extends Task {

    async run( { guild, reportee, reporter }) {
        const _guild = this.client.guilds.resolve(guild);
        if (_guild)
        {
            const _reportee = this.client.users.resolve(reportee);
            if (_reportee)
            {
                await _reportee.settings.update(`${guild}.reports`, `${reporter}`, {action: 'remove'});
            }
    }
    }

};


