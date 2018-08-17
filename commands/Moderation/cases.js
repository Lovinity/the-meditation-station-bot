const {Command, util} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'cases',
            permLevel: 4,
            runIn: ['text'],
            description: 'Get information about a given user modlogs. Must be used in a staff or incidents channel.',
            subcommands: true,
            usage: '<show|remove|appeal> <user:username> [caseID:string]',
            usageDelim: ' | '
        });
    }

    async show(msg, [user, caseID = null]) {
        // Bail if the command was not run in a staff category channel or incidents category channel.
        if (!msg.channel.parent || (msg.channel.parent.id !== msg.guild.settings.get('incidentsCategory') && msg.channel.parent.id !== msg.guild.settings.get('staffCategory')))
        {
            await msg.channel.send(`:x: For confidentiality, the cases command may only be used in a staff channel or incidents channel.`);
            return msg.delete({reason: `Use of !cases channel outside of a staff or incidents channel`});
        }
        
        // Get the modLogs
        const modLogs = user.settings[msg.guild.id].modLogs;

        // If a case ID was provided, return info about that case if found
        if (caseID !== null)
        {
            var log = modLogs.find(function (element) {
                return element.case === caseID;
            });

            if (log)
            {
                return msg.send([
                    `Case ID   : ${log.case}`,
                    `Date      : ${log.date}`,
                    `Type      : ${log.type}`,
                    `User      : ${log.user.tag} (${log.user.id})`,
                    `Moderator : ${log.moderator.tag} (${log.moderator.id})`,
                    `Reason:   : ${log.reason}`,
                    `Expiration: ${log.expiration}`,
                    `Discipline: ${JSON.stringify(log.discipline)}`,
                    `Counts?   : ${log.valid ? "Yes" : "No"}`
                ], {code: 'http'});
            } else {
                return msg.send(`:x: The provided user and case ID were not found.`);
            }
            // If no case ID provided, provide a mod history of the user
        } else {


            var actions = {
                ban: 0,
                mute: 0,
                tempban: 0,
                warn: 0,
                discipline: 0
            };

            var cases = {
                ban: [],
                mute: [],
                tempban: [],
                warn: [],
                discipline: []
            };

            modLogs.forEach(function (log) {
                if (typeof actions[log.type] !== 'undefined' && log.valid)
                    actions[log.type]++;
                if (typeof cases[log.type] !== 'undefined' && log.valid)
                    cases[log.type].push(log.case);
            });

            var final = {
                warn: `${actions.warn} (${cases.warn.join(", ")})`,
                discipline: `${actions.discipline} (${cases.discipline.join(", ")})`,
                mute: `${actions.mute} (${cases.mute.join(", ")})`,
                tempban: `${actions.tempban} (${cases.tempban.join(", ")})`,
                ban: `${actions.ban} (${cases.ban.join(", ")})`
            };

            return msg.send([
                `${user.tag} (${user.id}) Moderation Logs:`,
                util.codeBlock('http', Object.entries(final).map(([action, value]) => `${util.toTitleCase(`${action}s`).padEnd(11)}: ${value}`).join('\n'))
            ]);
    }
    }

    async remove(msg, [user, caseID = null]) {

        if (caseID === null)
            return msg.send(`:x: caseID is required when removing a case.`);

        // Get the modLogs
        const modLogs = user.settings[msg.guild.id].modLogs;

        var log = modLogs.find(function (element) {
            return element.case === caseID;
        });

        if (log)
        {
            await user.settings.update(`${msg.guild.id}.modLogs`, log, {action: 'remove'});
            log.valid = false;
            await user.settings.update(`${msg.guild.id}.modLogs`, log, {action: 'add'});

            const channel2 = msg.guild.channels.get(msg.guild.settings.get('modLogChannel'));
            if (channel2)
            {
                channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} against ${log.user.tag}) was removed / no longer counts on !cases summary.`);
            }

            return msg.send(`:white_check_mark: The log has been marked as invalid; though it remains in the system, it will not count towards the user records.`);
        } else {
            return msg.send(`:x: The provided user and case ID were not found.`);
    }
    // If no case ID provided, provide a mod history of the user
    }

    async appeal(msg, [user, caseID = null]) {

        if (caseID === null)
            return msg.send(`:x: caseID is required when appealing a case.`);

        // Get the modLogs
        const modLogs = user.settings[msg.guild.id].modLogs;

        var log = modLogs.find(function (element) {
            return element.case === caseID;
        });

        if (log)
        {
            await user.settings.update(`${msg.guild.id}.modLogs`, log, {action: 'remove'});
            log.valid = false;
            await user.settings.update(`${msg.guild.id}.modLogs`, log, {action: 'add'});

            // Now, appeal all discipline
            if (log.discipline.xp > 0)
            {
                user.settings.update(`${msg.guild.id}.xp`, (user.settings[msg.guild.id].xp + log.discipline.xp));
            }
            if (log.discipline.yang > 0)
            {
                user.settings.update(`${msg.guild.id}.yang`, (user.settings[msg.guild.id].yang + log.discipline.yang));
            }
            if (log.discipline.reputation > 0)
            {
                user.settings.update(`${msg.guild.id}.badRep`, (user.settings[msg.guild.id].badRep - log.discipline.reputation));
            }

            const guildMember = msg.guild.members.get(user.id);

            if (log.type === 'tempban' || log.type === 'ban')
            {
                if (log.discipline.schedule !== null)
                    await this.client.schedule.delete(log.discipline.schedule);
                await msg.guild.members.unban(user, `Ban was appealed`);

                if (log.type === 'tempban')
                {
                    // Remove the suspension if it is pending in the guild
                    const pendSuspensions = msg.guild.settings.get('pendSuspensions');
                    if (pendSuspensions && pendSuspensions.length > 0)
                    {
                        pendSuspensions.forEach(function (suspension) {
                            if (suspension.user === user.id)
                                msg.guild.settings.update(`pendSuspensions`, suspension, {action: 'remove'});
                        });
                    }
                }
                if (log.type === 'ban')
                {
                    // Remove the ban if it is pending in the guild
                    const pendBans = msg.guild.settings.get('pendBans');
                    if (pendBans && pendBans.length > 0)
                    {
                        pendBans.forEach(function (ban) {
                            if (ban.user === user.id)
                                msg.guild.settings.update(`pendBans`, ban, {action: 'remove'});
                        });
                    }
                }
            }

            if (log.type === 'mute')
            {
                if (log.type.discipline.schedule !== null)
                    await this.client.schedule.delete(log.type.discipline.schedule);

                // Get the configured muted role
                const muted = this.guild.settings.get(`muteRole`);
                const mutedRole = this.guild.roles.get(muted);

                // Add the mute role to the user, if the user is in the guild
                if (guildMember)
                {
                    guildMember.roles.remove(mutedRole, `Mute was appealed`);
                } else {
                    // Otherwise, remove mutedRole to the list of roles for the user so it's applied when/if they return
                    user.settings.update(`${msg.guild.id}.roles`, mutedRole.id, {action: 'remove'});
                }
            }

            // Remove incident if it is pending in the guild
            const pendIncidents = msg.guild.settings.get('pendIncidents');
            if (pendIncidents && pendIncidents.length > 0)
            {
                pendIncidents.forEach(function (incident) {
                    if (incident.user === user.id)
                        msg.guild.settings.update(`pendIncidents`, incident, {action: 'remove'});
                });
            }

            if (log.channel !== null)
            {
                const channel = msg.guild.channels.get(log.channel);
                if (channel)
                {
                    channel.send(`:negative_squared_cross_mark: This incident has been appealed, and issued discipline was reversed.`);
                }
            }

            const channel2 = msg.guild.channels.get(msg.guild.settings.get('modLogChannel'));
            if (channel2)
            {
                channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} against ${log.user.tag}) was appealed, and all discipline reversed.`);
            }


            return msg.send(`:white_check_mark: The log has been appealed and discipline reversed; though it remains in the system, it will not count towards the user records.`);
        } else {
            return msg.send(`:x: The provided user and case ID were not found.`);
    }
    // If no case ID provided, provide a mod history of the user
    }

};


