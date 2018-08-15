const {Event} = require('klasa');

module.exports = class extends Event {

    run(guildMember) {

        // Get the configured modLog channel.
        const modLog = guildMember.guild.settings.get('modLogChannel');

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.get(modLog);

        // send a log to the channel
        _channel.send(`:wave: The member <@!${guildMember.user.id}> just left the guild.`);

        // Finalize any bans if the member has them
        const modLogs = guildMember.user.settings[guildMember.guild.id].modLogs;
        var log = modLogs.find(function (element) {
            return element.type === 'ban' && element.valid;
        });
        guildMember.ban({ days: 7, reason: log.reason });

    }

};


