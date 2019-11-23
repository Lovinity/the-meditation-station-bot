const { Command, util, RichMenu } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'cases',
            permLevel: 4,
            runIn: [ 'text' ],
            description: 'Get information about a given user modlogs, and perform actions on them. Must be used in a staff or incidents channel.',
            usage: '<user:username>',
            usageDelim: ' | ',
            requiredSettings: [ "incidentsCategory", "staffCategory" ],
        });
    }

    async run (message, [ user ]) {
        // Bail if the command was not run in a staff category channel or incidents category channel.
        if (!message.channel.parent || (message.channel.parent.id !== message.guild.settings.incidentsCategory && message.channel.parent.id !== message.guild.settings.staffCategory)) {
            await message.send(`:x: For confidentiality, the cases command may only be used in a staff channel or incidents channel.`);
            return message.delete({ reason: `Use of !cases channel outside of a staff or incidents channel` });
        }

        // Get the modLogs
        const modLogs = user.guildSettings(message.guild.id).modLogs;

        // Prepare organized variables
        var cases = {
            classA: [],
            classB: [],
            classC: [],
            classD: [],
            classE: [],
            classF: [],
            classG: []
        };

        var rules = {};

        // Count each discipline type in actions, and place each log in its appropriate type in cases
        modLogs.map((log) => {
            if (typeof cases[ log.type ] !== 'undefined')
                cases[ log.type ].push({ id: log.case, issued: log.date, moderator: log.moderator.tag, valid: log.valid });
            if (typeof log.rules !== 'undefined' && log.rules.length > 0) {
                log.rules.map((rule) => {
                    if (typeof rules[ `Rule ${rule}` ] === 'undefined')
                        rules[ `Rule ${rule}` ] = [];
                    rules[ `Rule ${rule}` ].push({ id: log.case, issued: log.date, moderator: log.moderator.tag, valid: log.valid });
                })
            }
        });

        // Construct a rich menu, starting with the count of active cases in each discipline type
        var menu = new RichMenu(new MessageEmbed()
            .setTitle(`ModLogs for ${user.tag}, grouped by highest discipline class.`)
            .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to view cases under that type of discipline.')
        );
        // Populate counts... each type is also an option in the menu
        Object.entries(cases).map(([ key, value ]) => {
            if (value.length > 0) {
                value = value.filter(record => record.valid)
            }
            menu.addOption(key, `**${value.length}** active cases`);
        });
        menu.addOption(`View by Rule Number`, `Choose this option to instead see/view cases sorted by rule number violated.`);
        var collector = await menu.run(await message.send('Please wait...'), { time: 180000, filter: (reaction, user) => user.id === message.author.id });
        var choice = await collector.selection;
        if (menu.options[ choice ]) {
            var chosen = menu.options[ choice ].name;
            if (chosen === `View by Rule Number`) {
                var menu = new RichMenu(new MessageEmbed()
                    .setTitle(`ModLogs for ${user.tag} sorted by rule number`)
                    .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to view cases under that rule number.')
                );
                Object.entries(rules).map(([ key, value ]) => {
                    if (value.length > 0) {
                        value = value.filter(record => record.valid)
                    }
                    menu.addOption(key, `**${value.length}** active cases`);
                });
                var collector = await menu.run(await message.send('Please wait...'), { time: 180000, filter: (reaction, user) => user.id === message.author.id });
                var choice = await collector.selection;
                if (menu.options[ choice ]) {
                    var chosen = menu.options[ choice ].name;
                    var menu = new RichMenu(new MessageEmbed()
                        .setTitle(`ModLogs regarding ${chosen} for user ${user.tag}`)
                        .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to view that case and select from actions to take.')
                    );
                    rules[ chosen ].map((modLog) => {
                        menu.addOption(modLog.id, `Issued **${modLog.issued}** by **${modLog.moderator}**. Active? ${modLog.valid}`);
                    });
                    var collector = await menu.run(await message.send('Please wait...'), { time: 180000, filter: (reaction, user) => user.id === message.author.id });
                    var choice = await collector.selection;
                    if (menu.options[ choice ]) {
                        return runCase(message, user, modLogs, chosen, menu.options[ choice ].name);
                    } else {
                        return message.send(`:stop_button: The request was canceled.`);
                    }
                } else {
                    return message.send(`:stop_button: The request was canceled.`);
                }
            } else if (cases.hasOwnProperty(chosen)) {
                var menu = new RichMenu(new MessageEmbed()
                    .setTitle(`${chosen} ModLogs for ${user.tag}`)
                    .setDescription('Use the arrow reactions to scroll between pages.\nUse number reactions to view that case and select from actions to take.')
                );
                cases[ chosen ].map((modLog) => {
                    menu.addOption(modLog.id, `Issued **${modLog.issued}** by **${modLog.moderator}**. Active? ${modLog.valid}`);
                });
                var collector = await menu.run(await message.send('Please wait...'), { time: 180000, filter: (reaction, user) => user.id === message.author.id });
                var choice = await collector.selection;
                if (menu.options[ choice ]) {
                    return runCase(message, user, modLogs, chosen, menu.options[ choice ].name);
                } else {
                    return message.send(`:stop_button: The request was canceled.`);
                }
            }
        } else {
            return message.send(`:stop_button: The request was canceled.`);
        }
    }

};


async function runCase (message, user, modLogs, chosen, chosen2) {
    var log = modLogs.find((element) => {
        return element.case === chosen2;
    });
    if (log) {
        var menu = new RichMenu(new MessageEmbed()
            .setTitle(`ModLog ${chosen2} (${chosen}) for ${user.tag}`)
            .setDescription(`Date      : ${log.date}
Moderator : ${log.moderator.tag} (${log.moderator.id})
Rules : ${log.rules.join(", ")}
Reason:   : ${log.reason}
Expiration: ${log.expiration}
Discipline: Basic ${JSON.stringify(log.discipline)}, class D ${JSON.stringify(log.classD)}, channel Restrictions ${JSON.stringify(log.channelRestrictions)}, restrictive roles ${JSON.stringify(log.permissions)}
Additional: ${log.otherDiscipline}

Use number reactions to select an action, or stop to exit.`)
        );
        menu.addOption(`remove`, `Remove this case from user records, but do not reverse the discipline.`);
        menu.addOption(`appeal`, `Remove this case from user records, AND reverse the discipline.`);
        var collector = await menu.run(await message.send('Please wait...'), { time: 180000, filter: (reaction, user) => user.id === message.author.id });
        var choice = await collector.selection;
        if (menu.options[ choice ]) {
            var chosen3 = menu.options[ choice ].name;
            if (chosen3 === 'remove') {
                await user.guildSettings(message.guild.id).update(`modLogs`, log, { action: 'remove' });
                log.valid = false;
                await user.guildSettings(message.guild.id).update(`modLogs`, log, { action: 'add' });
                const channel2 = message.guild.channels.resolve(message.guild.settings.modLogChannel);
                if (channel2) {
                    channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} against ${log.user.tag}) was removed by ${message.author.tag} (${message.author.id}), but the discipline remains in place.`);
                }
            }
            if (chosen3 === 'appeal') {
                await user.guildSettings(message.guild.id).update(`modLogs`, log, { action: 'remove' });
                log.valid = false;
                await user.guildSettings(message.guild.id).update(`modLogs`, log, { action: 'add' });

                // Now, appeal all discipline
                if (log.discipline.xp !== 0) {
                    user.guildSettings(message.guild.id).update(`xp`, (user.guildSettings(message.guild.id).xp + log.discipline.xp));
                }
                if (log.discipline.yang !== 0) {
                    user.guildSettings(message.guild.id).update(`yang`, (user.guildSettings(message.guild.id).yang + log.discipline.yang));
                }
                if (log.discipline.reputation !== 0) {
                    user.guildSettings(message.guild.id).update(`badRep`, (user.guildSettings(message.guild.id).badRep - log.discipline.reputation));
                }

                const guildMember = message.guild.members.resolve(user.id);

                if (log.banDuration !== null) {
                    if (log.discipline.schedule !== null)
                        this.client.schedule.delete(log.discipline.schedule)
                            .catch(err => {
                                // Do not error on problems
                            });
                    await message.guild.members.unban(user, `Ban was appealed`);

                    if (log.banDuration > 0) {
                        // Remove the suspension if it is pending in the guild
                        const pendSuspensions = message.guild.settings.pendSuspensions;
                        if (pendSuspensions && pendSuspensions.length > 0) {
                            pendSuspensions.map((suspension) => {
                                if (suspension.user === user.id)
                                    message.guild.settings.update(`pendSuspensions`, suspension, { action: 'remove' });
                            });
                        }
                    }
                    if (log.banDuration === 0) {
                        // Remove the ban if it is pending in the guild
                        const pendBans = message.guild.settings.pendBans;
                        if (pendBans && pendBans.length > 0) {
                            pendBans.map((ban) => {
                                if (ban.user === user.id)
                                    message.guild.settings.update(`pendBans`, ban, { action: 'remove' });
                            });
                        }
                    }
                }

                if (log.muteDuration !== null) {
                    if (log.discipline.schedule !== null)
                        this.client.schedule.delete(log.discipline.schedule)
                            .catch(err => {
                                // Do not error on problems
                            });

                    // Get the configured muted role
                    const muted = message.guild.settings.muteRole;
                    const mutedRole = message.guild.roles.resolve(muted);

                    // Add the mute role to the user, if the user is in the guild
                    if (guildMember) {
                        guildMember.roles.remove(mutedRole, `Mute was appealed`);
                    } else {
                        // Otherwise, remove mutedRole to the list of roles for the user so it's applied when/if they return
                        user.guildSettings(message.guild.id).update(`roles`, mutedRole, message.guild, { action: 'remove' });
                    }
                }

                // Remove channel restrictions
                if (log.channelRestrictions.length > 0) {
                    log.channelRestrictions.map(channel => {
                        var theChannel = message.guild.channels.resolve(channel)

                        if (theChannel) {
                            var overwrite = theChannel.permissionOverwrites.get(user.id);

                            if (overwrite)
                                overwrite.delete(`Discipline case ${log.case} appealed`);
                        }
                    })
                }

                // Remove permission restriction roles
                if (log.permissions.length > 0) {
                    log.permissions.map(permission => {
                        var theRole = message.guild.roles.resolve(permission)

                        if (theRole) {
                            if (guildMember) {
                                guildMember.roles.remove(theRole, `Discipline case ${log.case} appealed`);
                            } else {
                                user.guildSettings(message.guild.id).update(`roles`, theRole, message.guild, { action: 'remove' });
                            }
                        }
                    })
                }

                // Remove incident if it is pending in the guild
                const pendIncidents = message.guild.settings.pendIncidents;
                if (pendIncidents && pendIncidents.length > 0) {
                    pendIncidents.map((incident) => {
                        if (incident.user === user.id)
                            message.guild.settings.update(`pendIncidents`, incident, { action: 'remove' });
                    });
                }

                if (log.channel !== null) {
                    const channel = message.guild.channels.resolve(log.channel);
                    if (channel) {
                        channel.send(`:negative_squared_cross_mark: This incident has been appealed by ${message.author.tag} (${message.author.id}), and issued discipline was reversed.`);
                    }
                }

                const channel2 = message.guild.channels.resolve(message.guild.settings.modLogChannel);
                if (channel2) {
                    channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} against ${log.user.tag}) was appealed by ${message.author.tag} (${message.author.id}), and all discipline reversed.`);
                }
            }
            return message.send(`:white_check_mark: Action completed.`);
        } else {
            return message.send(`:stop_button: The request was canceled.`);
        }
    }
}