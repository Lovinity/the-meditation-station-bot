const {Command, util, RichMenu} = require('klasa');
const {MessageEmbed} = require('discord.js');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'cases',
            permLevel: 4,
            runIn: ['text'],
            description: 'Get information about a given user modlogs, and perform actions on them. Must be used in a staff or incidents channel.',
            usage: '<user:username>',
            usageDelim: ' | ',
            requiredSettings: ["incidentsCategory", "staffCategory"],
        });
    }

    async run(message, [user]) {
        // Bail if the command was not run in a staff category channel or incidents category channel.
        if (!message.channel.parent || (message.channel.parent.id !== message.guild.settings.get('incidentsCategory') && message.channel.parent.id !== message.guild.settings.get('staffCategory')))
        {
            await message.channel.send(`:x: For confidentiality, the cases command may only be used in a staff channel or incidents channel.`);
            return message.delete({reason: `Use of !cases channel outside of a staff or incidents channel`});
        }

        // Get the modLogs
        const modLogs = user.settings[message.guild.id].modLogs;

        var actions = {
            warn: 0,
            discipline: 0,
            mute: 0,
            tempban: 0,
            ban: 0
        };

        var cases = {
            warn: [],
            discipline: [],
            mute: [],
            tempban: [],
            ban: [],
        };

        modLogs.forEach(function (log) {
            if (typeof actions[log.type] !== 'undefined' && log.valid)
                actions[log.type]++;
            if (typeof cases[log.type] !== 'undefined' && log.valid)
                cases[log.type].push({id: log.case, issued: log.date, moderator: log.moderator.tag});
        });

        var menu = new RichMenu(new MessageEmbed()
                .setTitle(`ModLogs for ${user.tag}`)
                .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to view cases under that type of discipline.')
                );
        Object.entries(actions).map(([key, value]) => {
            menu.addOption(key, `**${value}** active cases`);
        });
        var collector = await menu.run(await message.channel.send('Please wait...'), {time: 180000, filter: (reaction, user) => user.id === message.author.id});
        var choice = await collector.selection;
        await collector.message.delete();
        if (menu.options[choice])
        {
            var chosen = menu.options[choice].name;
            if (cases.hasOwnProperty(chosen))
            {
                var menu = new RichMenu(new MessageEmbed()
                        .setTitle(`${chosen} ModLogs for ${user.tag}`)
                        .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to view that case and select from actions to take.')
                        );
                cases[chosen].forEach(function (modLog) {
                    menu.addOption(modLog.id, `Issued **${modLog.issued}** by **${modLog.moderator}**`);
                });
                var collector = await menu.run(await message.channel.send('Please wait...'), {time: 180000, filter: (reaction, user) => user.id === message.author.id});
                var choice = await collector.selection;
                await collector.message.delete();
                if (menu.options[choice])
                {
                    var chosen2 = menu.options[choice].name;
                    var log = modLogs.find(function (element) {
                        return element.case === chosen2;
                    });
                    if (log)
                    {
                        var menu = new RichMenu(new MessageEmbed()
                                .setTitle(`ModLog ${chosen2} (${chosen}) for ${user.tag}`)
                                .setDescription(`Date      : ${log.date}
Moderator : ${log.moderator.tag} (${log.moderator.id})
Reason:   : ${log.reason}
Expiration: ${log.expiration}
Discipline: ${JSON.stringify(log.discipline)}
Additional: ${log.otherDiscipline}

Use number reactions to select an action, or stop to exit.`)
                                );
                        menu.addOption(`remove`, `Remove this case from user records, but do not reverse the discipline.`);
                        menu.addOption(`appeal`, `Remove this case from user records, AND reverse the discipline.`);
                        var collector = await menu.run(await message.channel.send('Please wait...'), {time: 180000, filter: (reaction, user) => user.id === message.author.id});
                        var choice = await collector.selection;
                        await collector.message.delete();
                        if (menu.options[choice])
                        {
                            var chosen3 = menu.options[choice].name;
                            if (chosen3 === 'remove')
                            {
                                await user.settings.update(`${message.guild.id}.modLogs`, log, {action: 'remove'});
                                log.valid = false;
                                await user.settings.update(`${message.guild.id}.modLogs`, log, {action: 'add'});
                                const channel2 = message.guild.channels.get(message.guild.settings.get('modLogChannel'));
                                if (channel2)
                                {
                                    channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} against ${log.user.tag}) was removed by ${message.author.tag} (${message.author.id}), but the discipline remains in place.`);
                                }
                            }
                            if (chosen3 === 'appeal')
                            {
                                await user.settings.update(`${message.guild.id}.modLogs`, log, {action: 'remove'});
                                log.valid = false;
                                await user.settings.update(`${message.guild.id}.modLogs`, log, {action: 'add'});
                                // Now, appeal all discipline
                                if (log.discipline.xp > 0)
                                {
                                    user.settings.update(`${message.guild.id}.xp`, (user.settings[message.guild.id].xp + log.discipline.xp));
                                }
                                if (log.discipline.yang > 0)
                                {
                                    user.settings.update(`${message.guild.id}.yang`, (user.settings[message.guild.id].yang + log.discipline.yang));
                                }
                                if (log.discipline.reputation > 0)
                                {
                                    user.settings.update(`${message.guild.id}.badRep`, (user.settings[message.guild.id].badRep - log.discipline.reputation));
                                }

                                const guildMember = message.guild.members.get(user.id);

                                if (log.type === 'tempban' || log.type === 'ban')
                                {
                                    if (log.discipline.schedule !== null)
                                        this.client.schedule.delete(log.discipline.schedule)
                                                .catch(err => {

                                                });
                                    await message.guild.members.unban(user, `Ban was appealed`);

                                    if (log.type === 'tempban')
                                    {
                                        // Remove the suspension if it is pending in the guild
                                        const pendSuspensions = message.guild.settings.get('pendSuspensions');
                                        if (pendSuspensions && pendSuspensions.length > 0)
                                        {
                                            pendSuspensions.forEach(function (suspension) {
                                                if (suspension.user === user.id)
                                                    message.guild.settings.update(`pendSuspensions`, suspension, {action: 'remove'});
                                            });
                                        }
                                    }
                                    if (log.type === 'ban')
                                    {
                                        // Remove the ban if it is pending in the guild
                                        const pendBans = message.guild.settings.get('pendBans');
                                        if (pendBans && pendBans.length > 0)
                                        {
                                            pendBans.forEach(function (ban) {
                                                if (ban.user === user.id)
                                                    message.guild.settings.update(`pendBans`, ban, {action: 'remove'});
                                            });
                                        }
                                    }
                                }

                                if (log.type === 'mute')
                                {
                                    if (log.discipline.schedule !== null)
                                        this.client.schedule.delete(log.discipline.schedule)
                                                .catch(err => {

                                                });

                                    // Get the configured muted role
                                    const muted = message.guild.settings.get(`muteRole`);
                                    const mutedRole = message.guild.roles.get(muted);

                                    // Add the mute role to the user, if the user is in the guild
                                    if (guildMember)
                                    {
                                        guildMember.roles.remove(mutedRole, `Mute was appealed`);
                                    } else {
                                        // Otherwise, remove mutedRole to the list of roles for the user so it's applied when/if they return
                                        user.settings.update(`${message.guild.id}.roles`, mutedRole.id, {action: 'remove'});
                                    }
                                }

                                // Remove incident if it is pending in the guild
                                const pendIncidents = message.guild.settings.get('pendIncidents');
                                if (pendIncidents && pendIncidents.length > 0)
                                {
                                    pendIncidents.forEach(function (incident) {
                                        if (incident.user === user.id)
                                            message.guild.settings.update(`pendIncidents`, incident, {action: 'remove'});
                                    });
                                }

                                if (log.channel !== null)
                                {
                                    const channel = message.guild.channels.get(log.channel);
                                    if (channel)
                                    {
                                        channel.send(`:negative_squared_cross_mark: This incident has been appealed by ${message.author.tag} (${message.author.id}), and issued discipline was reversed.`);
                                    }
                                }

                                const channel2 = message.guild.channels.get(message.guild.settings.get('modLogChannel'));
                                if (channel2)
                                {
                                    channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} against ${log.user.tag}) was appealed by ${message.author.tag} (${message.author.id}), and all discipline reversed.`);
                                }
                            }
                            return message.send(`:white_check_mark: Action completed.`);
                        } else {
                            return message.send(`:stop_button: The request was canceled.`);
                        }
                    }
                } else {
                    return message.send(`:stop_button: The request was canceled.`);
                }
            }
        } else {
            return message.send(`:stop_button: The request was canceled.`);
        }

        return message.send([
            `${user.tag} (${user.id}) Moderation Logs:`,
            util.codeBlock('http', Object.entries(final).map(([action, value]) => `${util.toTitleCase(`${action}s`).padEnd(11)}: ${value}`).join('\n'))
        ]);
    }

};


