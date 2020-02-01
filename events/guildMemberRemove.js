const { Event } = require('klasa');
const moment = require('moment');

module.exports = class extends Event {

    async run (guildMember) {

        // Can't do anything if the guild member is a partial
        if (guildMember.partial) {
            const owner = this.client.application.owner;
            if (owner) {
                owner.send(`:question: Partial guild member ${guildMember.id} left.`);
            }
            return;
        }

        // Get the configured modLog channel.
        const modLog = guildMember.guild.settings.eventLogChannel;

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.resolve(modLog);
        const generalChannel = this.client.channels.resolve(guildMember.guild.settings.generalChannel);
        var modLogChannel = guild.channels.resolve(guild.settings.modLogChannel);

        // Find out who kicked the member
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_KICK',
        });
        const auditLog = fetchedLogs.entries.first();
        if (!auditLog || auditLog.target.id !== guildMember.id)
            auditLog = undefined;

        // send a log to the channel
        if (_channel)
            _channel.send(`:wave: The member <@${guildMember.user.id}> (${guildMember.user.id}) just left the guild on ${moment().format('LLLL')} guild time.`);

        // If mewmber was kicked, log it in mod log channel
        if (auditLog && modLogChannel)
            modLogChannel.send(`:athletic_shoe: The member <@${guildMember.user.id}> was kicked from the guild by ${auditLog.executor.tag} (${auditLog.executor.id}).`);

        // Finalize any suspensions if the member has them
        const pendSuspensions = guildMember.guild.settings.pendSuspensions;
        if (pendSuspensions && pendSuspensions.length > 0) {
            pendSuspensions.map((suspension) => {
                if (suspension.user === guildMember.id) {
                    guildMember.ban({ days: 7, reason: suspension.reason });
                    this.client.schedule.create('removeban', moment().add(suspension.duration, 'minutes').toDate(), {
                        data: {
                            user: guildMember.user.id,
                            guild: guildMember.guild.id,
                            incidentsChannel: (suspension.channel !== null) ? suspension.channel : null
                        }
                    });
                    guildMember.guild.settings.update(`pendSuspensions`, suspension, { action: 'remove' });
                    guildMember.settings.update(`modLogs`, suspension.case, { action: 'remove' })
                        .then(resp => {
                            suspension.case.expiration = moment().add(suspension.duration, 'minutes').toISOString(true);
                            guildMember.settings.update(`modLogs`, suspension.case, { action: 'add' });
                        });
                    if (_channel)
                        _channel.send(`:wave: A pending suspension / tempban existed on <@!${guildMember.user.id}> (${guildMember.user.id}). It was applied.`);
                }
            });
        }

        // Finalize any bans if the member has them
        const pendBans = guildMember.guild.settings.pendBans;
        if (pendBans && pendBans.length > 0) {
            pendBans.map((ban) => {
                if (ban.user === guildMember.id) {
                    guildMember.ban({ days: 7, reason: ban.reason });
                    guildMember.guild.settings.update(`pendBans`, ban, { action: 'remove' });
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

        // Remove any of the member's purchased advertisements
        if (guildMember.guild.settings.ads.length > 0) {
            guildMember.guild.settings.ads
                .filter((ad) => ad.author === guildMember.id)
                .map((ad) => {
                    guildMember.guild.settings.update('ads', ad, { action: 'remove' });
                })
        }

        // Post about losing the opportunity to appeal, if applicable.
        guildMember.guild.channels
            .filter((channel) => channel.topic && channel.topic !== null && channel.topic.startsWith(`Discipline ${guildMember.user.id}`))
            .each((channel) => {
                channel.send(`:arrows_counterclockwise: :x: This member left the guild. They can no longer motion to appeal this discipline.`)
            });

        // Post in interrogation channels if applicable.
        guildMember.guild.channels
            .filter((channel) => channel.name.startsWith("interrogation-") && channel.topic && channel.topic !== null && channel.topic.includes(guildMember.user.id))
            .each((channel) => {
                channel.send(`:arrows_counterclockwise: :x: <@${guildMember.user.id}> left the guild. Please treat this as a motion they no longer want to be interrogated (immediately proceed to deciding on what action to take, if any).`)
            });

        // Post in general if the member left within 1 hour of joining
        if (moment().subtract(1, 'hours').isBefore(moment(guildMember.joinedAt)) && generalChannel) {
            generalChannel.send(`:frowning: O-oh, <@${guildMember.user.id}> did not want to stay after all.`);
        }

    }

};


