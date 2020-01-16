const { Route } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');
const moment = require("moment");

module.exports = class extends Route {

    constructor(...args) {
        super(...args, {
            route: 'profile/modlogs',
            authenticated: true
        });
    }

    async get (request, response) {

        if (!request.query.guild) return response.end(JSON.stringify({ error: "Guild was not specified" }));
        if (!request.query.user) return response.end(JSON.stringify({ error: "User was not specified" }));

        const guild = this.client.guilds.resolve(request.query.guild)
        if (!guild) return response.end(JSON.stringify({ error: "The bot is not in the provided guild." }));

        try {
            var authUser = await this.client.users.fetch(request.auth.scope[ 0 ]);
            if (!authUser) throw new Error("Authorized user not found");
            var authMember = await guild.members.fetch(authUser.id);
            if (!authMember) throw new Error("Authorized user does not seem to be in the provided guild.");
        } catch (e) {
            return response.end(JSON.stringify({ error: `Unable to fetch the authorized user.` }));
        }

        if (authUser.id !== request.query.user) {
            if (guild && guild.settings.modRole) {
                if (!authMember.roles.get(guild.settings.modRole)) return response.end(JSON.stringify({ error: `You do not have the guild's modRole and therefore are not allowed to view other users' moderation logs.` }));
            } else if (!authMember.permissions.has('VIEW_AUDIT_LOG')) {
                return response.end(JSON.stringify({ error: `You do not have VIEW_AUDIT_LOG permissions and therefore are not allowed to view other users' moderation logs.` }));
            }
        }

        try {
            var user = await this.client.users.fetch(request.query.user);
            if (!user) throw new Error("User not found");
        } catch (e) {
            return response.end(JSON.stringify({ error: "Unable to fetch the provided user." }));
        }

        var settings = await user.guildSettings(guild.id);
        var modLogs = settings.modLogs;

        var respond = [];
        if (modLogs.length > 0) {
            var maps = modLogs.map(async (log) => {
                var toPush = {
                    case: log.case,
                    sort: moment(log.date).valueOf(),
                    date: moment(log.date).format("LLL"),
                    type: log.type,
                    user: typeof log.user !== 'undefined' ? log.user.tag : 'Unknown User',
                    moderator: typeof log.moderator !== 'undefined' ? log.moderator.tag : 'Unknown Moderator',
                    reason: log.reason,
                    rules: log.rules,
                    discipline: log.discipline,
                    classD: log.classD,
                    channelRestrictions: log.channelRestrictions,
                    botRestrictions: log.botRestrictions,
                    permissions: log.permissions,
                    otherDiscipline: log.otherDiscipline,
                    expiration: moment(log.expiration).format("LLL"),
                    banDuration: log.banDuration,
                    muteDuration: log.muteDuration,
                    valid: log.valid
                };
                toPush.channelRestrictions = toPush.channelRestrictions.map((restriction) => {
                    var chan = guild.channels.resolve(restriction);
                    if (chan) {
                        return chan.name;
                    } else {
                        return `Unknown channel ${restriction}`
                    }
                });
                toPush.permissions = toPush.permissions.map((permission) => {
                    var role = guild.roles.resolve(permission);
                    if (role) {
                        return role.name;
                    } else {
                        return `Unknown role ${permission}`
                    }
                });
                respond.push(toPush);
            });
            await Promise.all(maps);
        }

        var compare = function (a, b) {
            try {
                if (a.sort < b.sort) { return 1 }
                if (a.sort > b.sort) { return -1 }
                return 0;
            } catch (e) {
                console.error(e)
            }
        }
        respond = respond.sort(compare);

        return response.end(JSON.stringify({ message: { tag: user.tag, modLogs: respond, restrictions: settings.restrictions, muted: settings.muted } }));
    }

    async post (request, response) {
        if (!request.body || !request.body.action) return response.end(JSON.stringify({ error: "An action is required." }));

        switch (request.body.action) {
            case 'appeal':
                if (!request.body.case) return response.end(JSON.stringify({ error: "case is required (ID of the case to appeal)." }));
                if (!request.body.guild) return response.end(JSON.stringify({ error: "guild is required (snowflake ID of the guild involved)." }));
                if (!request.body.user) return response.end(JSON.stringify({ error: "user is required (snowflake ID of the user which has the case being appealed)." }));

                const guild = this.client.guilds.resolve(request.body.guild)
                if (!guild) return response.end(JSON.stringify({ error: "The bot is not in the provided guild." }));

                try {
                    var authUser = await this.client.users.fetch(request.auth.scope[ 0 ]);
                    if (!authUser) throw new Error("Authorized user not found");
                    var authMember = await guild.members.fetch(authUser.id);
                    if (!authMember) throw new Error("Authorized user does not seem to be in the provided guild.");
                } catch (e) {
                    return response.end(JSON.stringify({ error: `Unable to fetch the authorized user.` }));
                }

                if (request.auth.scope[ 0 ] === request.body.user) return response.end(JSON.stringify({ error: "You cannot appeal your own cases." }));

                if (guild && guild.settings.modRole) {
                    if (!authMember.roles.get(guild.settings.modRole)) return response.end(JSON.stringify({ error: `You do not have the guild's modRole and therefore are not allowed to appeal cases.` }));
                } else if (!authMember.permissions.has('VIEW_AUDIT_LOG')) {
                    return response.end(JSON.stringify({ error: `You do not have VIEW_AUDIT_LOG permissions and therefore are not allowed to appeal cases.` }));
                }

                try {
                    var user = await this.client.users.fetch(request.body.user);
                    if (!user) throw new Error("User not found");
                } catch (e) {
                    return response.end(JSON.stringify({ error: "Unable to fetch the provided user." }));
                }

                var modLogs = settings.modLogs;
                if (modLogs.length < 1) return response.end(JSON.stringify({ error: "You are trying to appeal a case when the provided user has no cases on record." }));

                var log = modLogs.find((modLog) => modLog.case === request.body.case);
                if (!log) return response.end(JSON.stringify({ error: "The provided case ID was not found in the user's mod logs." }));

                if (log.moderator.id === authUser.id) return response.end(JSON.stringify({ error: "You are the responsible moderator for this case and therefore cannot appeal it. Please have a different staff member appeal it." }));

                // BEGIN appealing
                try {
                    await settings.update(`modLogs`, log, { action: 'remove' });
                    log.valid = false;
                    await settings.update(`modLogs`, log, { action: 'add' });

                    // Now, appeal all discipline
                    if (log.discipline.xp !== 0) {
                        settings.update(`xp`, (settings.xp + log.discipline.xp));
                    }
                    if (log.discipline.yang !== 0) {
                        settings.update(`yang`, (settings.yang + log.discipline.yang));
                    }
                    if (log.discipline.HPDamage !== 0) {
                        settings.update(`HPDamage`, (settings.HPDamage - log.discipline.HPDamage));
                    }

                    const guildMember = guild.members.resolve(user.id);

                    if (log.banDuration !== null) {
                        if (log.discipline.schedule !== null)
                            this.client.schedule.delete(log.discipline.schedule)
                                .catch(err => {
                                    // Do not error on problems
                                });
                        await guild.members.unban(user, `Ban was appealed`);

                        if (log.banDuration > 0) {
                            // Remove the suspension if it is pending in the guild
                            const pendSuspensions = guild.settings.pendSuspensions;
                            if (pendSuspensions && pendSuspensions.length > 0) {
                                pendSuspensions.map((suspension) => {
                                    if (suspension.user === user.id)
                                        guild.settings.update(`pendSuspensions`, suspension, { action: 'remove' });
                                });
                            }
                        }
                        if (log.banDuration === 0) {
                            // Remove the ban if it is pending in the guild
                            const pendBans = guild.settings.pendBans;
                            if (pendBans && pendBans.length > 0) {
                                pendBans.map((ban) => {
                                    if (ban.user === user.id)
                                        guild.settings.update(`pendBans`, ban, { action: 'remove' });
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
                        const muted = guild.settings.muteRole;
                        const mutedRole = guild.roles.resolve(muted);

                        // Add the mute role to the user, if the user is in the guild
                        if (guildMember) {
                            guildMember.roles.remove(mutedRole, `Mute was appealed`);
                        } else {
                            // Otherwise, set muted to false manually
                            await settings.update(`muted`, false, guild);
                        }
                    }

                    // Remove channel restrictions
                    if (log.channelRestrictions.length > 0) {
                        log.channelRestrictions.map(channel => {
                            var theChannel = guild.channels.resolve(channel)

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
                            var theRole = guild.roles.resolve(permission)

                            if (theRole) {
                                if (guildMember) {
                                    guildMember.roles.remove(theRole, `Discipline case ${log.case} appealed`);
                                } else {
                                    settings.update(`roles`, theRole, guild, { action: 'remove' });
                                }
                            }
                        })
                    }

                    // Remove bot restrictions
                    if (log.botRestrictions.length > 0) {
                        log.botRestrictions.map((restriction) => {
                            if (Object.keys(settings.restrictions).indexOf(restriction) !== -1) {
                                settings.update(`restrictions.${restriction}`, false);

                                if (restriction === 'cannotUseVoiceChannels' && guildMember) {
                                    guildMember.voice.setDeaf(false, 'cannotUseVoiceChannels appealed.');
                                    guildMember.voice.setMute(false, 'cannotUseVoiceChannels appealed.');
                                }
                            }
                        });
                    }

                    // Remove incident if it is pending in the guild
                    const pendIncidents = guild.settings.pendIncidents;
                    if (pendIncidents && pendIncidents.length > 0) {
                        pendIncidents.map((incident) => {
                            if (incident.user === user.id)
                                guild.settings.update(`pendIncidents`, incident, { action: 'remove' });
                        });
                    }

                    if (log.channel !== null) {
                        const channel = guild.channels.resolve(log.channel);
                        if (channel) {
                            channel.send(`:negative_squared_cross_mark: This incident has been appealed by ${authUser.tag} (${authUser.id}), and issued discipline was reversed.`);
                        }
                    }

                    const channel2 = guild.channels.resolve(guild.settings.modLogChannel);
                    if (channel2) {
                        channel2.send(`:negative_squared_cross_mark: Case ${log.case} (A ${log.type} discipline against ${log.user.tag}) was appealed by ${authUser.tag} (${authUser.id}), and all discipline reversed.`);
                    }
                } catch (e) {
                    return response.end(JSON.stringify({ error: "Internal error. Please contact the bot developer." }));
                }

                return response.end(JSON.stringify({ message: "Success" }));
                break;
        }
    }

};