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

        // Add a scheduled task to run every minute for the guild if it does not already exist
        const guildTask = guild.settings.guildTasks;
        if (!guildTask || guildTask === null)
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