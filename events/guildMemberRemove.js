const {Event} = require('klasa');
const moment = require('moment');

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
        const pendSuspensions = guildMember.guild.settings.get('pendSuspensions');
        // Pending suspension
        if (pendSuspensions && pendSuspensions.length > 0)
        {
            pendSuspensions.forEach(function (suspension) {
                if (suspension.user === guildMember.id)
                {
                    guildMember.ban({days: 7, reason: suspension.reason});
                    this.client.schedule.create('removeban', moment().add(suspension.duration, 'minutes').toDate(), {
                        data: {
                            user: guildMember.user.id,
                            guild: guildMember.guild.id,
                            incidentsChannel: (suspension.channel !== null) ? suspension.channel : null
                        }
                    });
                    guildMember.guild.settings.update(`pendSuspensions`, suspension, {action: 'remove'});
                    guildMember.user.settings.update(`${guildMember.guild.id}.modLogs`, suspension.case, {action: 'remove'})
                            .then(resp => {
                                suspension.case.expiration = moment().add(suspension.duration, 'minutes').toISOString(true);
                                guildMember.user.settings.update(`${guildMember.guild.id}.modLogs`, suspension.case, {action: 'add'});
                            });
                }
            });
        }

        // Finalize any bans if the member has them
        const pendBans = guildMember.guild.settings.get('pendBans');
        // Pending bans
        if (pendBans && pendBans.length > 0)
        {
            pendBans.forEach(function (ban) {
                if (ban.user === guildMember.id)
                {
                    guildMember.ban({days: 7, reason: ban.reason});
                    guildMember.guild.settings.update(`pendBans`, ban, {action: 'remove'});
                }
            });
        }

    }

};


