const {Event} = require('klasa');
const moment = require('moment');

module.exports = class extends Event {

    run(guildMember) {

        // Get the configured modLog channel.
        const modLog = guildMember.guild.settings.eventLogChannel;

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.resolve(modLog);

        // send a log to the channel
        if (_channel)
            _channel.send(`:wave: The member <@!${guildMember.user.id}> (${guildMember.user.id}) just left the guild on ${moment().format('LLLL')} guild time.`);

        // Finalize any bans if the member has them
        const pendSuspensions = guildMember.guild.settings.pendSuspensions;

        // Pending suspension
        if (pendSuspensions && pendSuspensions.length > 0)
        {
            pendSuspensions.map((suspension) => {
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
                    guildMember.settings.update(`modLogs`, suspension.case, {action: 'remove'})
                            .then(resp => {
                                suspension.case.expiration = moment().add(suspension.duration, 'minutes').toISOString(true);
                                guildMember.settings.update(`modLogs`, suspension.case, {action: 'add'});
                            });
                    if (_channel)
                        _channel.send(`:wave: A pending suspension / tempban existed on <@!${guildMember.user.id}> (${guildMember.user.id}). It was applied.`);
                }
            });
        }

        // Finalize any bans if the member has them
        const pendBans = guildMember.guild.settings.pendBans;
        // Pending bans
        if (pendBans && pendBans.length > 0)
        {
            pendBans.map((ban) => {
                if (ban.user === guildMember.id)
                {
                    guildMember.ban({days: 7, reason: ban.reason});
                    guildMember.guild.settings.update(`pendBans`, ban, {action: 'remove'});
                    if (_channel)
                        _channel.send(`:wave: A pending ban existed on <@!${guildMember.user.id}> (${guildMember.user.id}). It was applied.`);
                }
            });
        }

        // Remove any invites created by the member; this helps prevent raids (user enters guild, creates invite, leaves, stages raid with the invite)
        guildMember.guild.fetchInvites()
                .then(invites => {
                    invites
                            .filter(invite => typeof invite.inviter === 'undefined' || invite.inviter === null || invite.inviter.id === guildMember.id)
                            .each((invite) => {
                                invite.delete('This invite has no inviter. Maybe the inviter left the guild?');
                                if (_channel)
                                    _channel.send(`:wastebasket: The invite ${invite.code} was deleted because an inviter did not exist. They probably left the guild.`);
                            });

                });

    }

};


