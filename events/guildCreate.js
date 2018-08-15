const {Event} = require('klasa');

module.exports = class extends Event {

    run(guild) {
        if (!guild.available)
            return;
        if (this.client.settings.guildBlacklist.includes(guild.id)) {
            guild.leave();
            this.client.emit('warn', `Blacklisted guild detected: ${guild.name} [${guild.id}]`);
            return;
        }

        // add guild into the users gateway if it does not exist
        const {schema} = this.client.gateways.users;
        if (!schema.has(message.guild.id))
        {
            schema.add(message.guild.id, {
                xp: {
                    type: 'integer',
                    default: 0
                },
                yang: {
                    type: 'integer',
                    default: 0
                },
                spamscore: {
                    type: 'integer',
                    default: 0
                },
                profile: {
                    type: 'any',
                    array: true
                },
                modLogs: {
                    type: 'any',
                    array: true
                },
                reports: {
                    type: 'string',
                    array: true
                },
                roles: {
                    type: 'string',
                    array: true
                }
            });
        }

        // Add a scheduled task to run every minute for the guild if it does not already exist
        const guildTask = guild.settings.get('guildTasks');
        if (!guildTask)
        {
            this.client.schedule.create('guildtasks', "* * * * *", {
                data: {
                    guild: guild.id,
                }
            })
                    .then((task) => {
                        guild.settings.update('guildTasks', task.id);
                    });
        }

    }

};