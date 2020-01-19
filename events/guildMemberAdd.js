const { Event } = require('klasa');
const _ = require("lodash");
const moment = require('moment');

module.exports = class extends Event {

    async run (guildMember) {

        await guildMember.settings.sync(true);

        // Get the configured modLog channel.
        const _channel = this.client.channels.resolve(guildMember.guild.settings.eventLogChannel);
        const _channelMod = this.client.channels.resolve(guildMember.guild.settings.modLogChannel);

        var updateLevels = (_guildMember) => {
            // Update level roles
            var levelRoles = {};
            var levelRoles2 = _guildMember.guild.settings.levelRoles;
            for (var key in levelRoles2) {
                if (levelRoles2.hasOwnProperty(key)) {
                    if (levelRoles2[ key ] === null)
                        continue;
                    levelRoles[ key.replace('level', '') ] = levelRoles2[ key ];
                }
            }
            var levelKeys = Object.keys(levelRoles);
            if (levelKeys.length > 0) {
                var rolesToAdd = [];
                var rolesToRemove = [];
                levelKeys.map(levelKey => {
                    var xp = Math.ceil(((levelKey - 1) / 0.177) ** 2);
                    if (_guildMember.guild.roles.has(levelRoles[ levelKey ])) {
                        if (_guildMember.settings.xp >= xp && !_guildMember.roles.has(levelRoles[ levelKey ])) {
                            rolesToAdd.push(levelRoles[ levelKey ]);
                        } else if (_guildMember.settings.xp < xp && _guildMember.roles.has(levelRoles[ levelKey ])) {
                            rolesToRemove.push(levelRoles[ levelKey ]);
                        }
                    }
                });

                if (rolesToAdd.length > 0)
                    _guildMember.roles.add(rolesToAdd, `Level Update (add roles)`)
                        .then(stuff => {
                            if (rolesToRemove.length > 0)
                                _guildMember.roles.remove(rolesToRemove, `Level Update (remove roles)`);
                        });
            }
        };

        // send a log to the channel
        if (_channel)
            _channel.send(`:tada: The member <@!${guildMember.user.id}> just joined the guild. They created their account on ${guildMember.user.createdAt.toUTCString()}`);

        // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
        const _channel2 = this.client.channels.resolve(guildMember.guild.settings.generalChannel);
        const verifiedRole = guildMember.guild.roles.resolve(guildMember.guild.settings.verifiedRole);
        const muteRole = guildMember.guild.roles.resolve(guildMember.guild.settings.muteRole);

        // Check if the member should be muted. If so, reset all roles
        if (muteRole && (guildMember.settings.muted || guildMember.roles.get(muteRole.id))) {
            guildMember.settings.update(`muted`, true, guildMember.guild);
            guildMember.roles.set([ guildMember.guild.settings.muteRole ], `User supposed to be muted`);
            if (_channelMod)
                _channelMod.send(`:mute: The member <@!${guildMember.user.id}> had a mute on their account and was re-muted upon entering the guild. Check to be sure they were not trying to mute evade.`);
        } else {
            // Re-assign saved roles
            if (guildMember.settings.verified && guildMember.settings.roles.length > 0) {
                guildMember.roles.set(guildMember.settings.roles, `Re-assigning roles`)
                    .then(() => {
                        // Verify the member if we are not in raid mitigation level 2+
                        if (guildMember.guild.settings.raidMitigation < 2 && verifiedRole) {
                            guildMember.roles.add(verifiedRole, `User is verified`);
                        }

                        if (_channel2)
                            _channel2.send(`**Welcome back** <@${guildMember.id}>! I see you have been here before. I remembered your profile, XP, Yang, HP, badges, profile info, roles, etc. Be sure to check out the welcome channel; the rules may have changed since you were last with us.`)
                        updateLevels(guildMember);
                    })
            } else if (guildMember.settings.verified) {
                // Verify the member if we are not in raid mitigation level 2+
                if (guildMember.guild.settings.raidMitigation < 2 && verifiedRole) {
                    if (_channel2)
                        _channel2.send(`**Welcome back** <@${guildMember.id}>! I see you have been here before. I remembered your profile, XP, Yang, HP, badges, profile info, roles, etc. Be sure to check out the welcome channel; the rules may have changed since you were last with us.`)
                    updateLevels(guildMember);
                    guildMember.roles.add(verifiedRole, `User is verified`);
                } else if (verifiedRole) {
                    const _channel3 = this.client.channels.resolve(guildMember.guild.settings.unverifiedChannel);
                    if (_channel3) {
                        _channel3.send(`**Welcome** <@${guildMember.id}>! Please stand by for a short while; you had already previously passed verification, but due to an ongoing raid, I cannot let you have full guild access until the raid ends.`)
                    }
                }
            } else if (verifiedRole) {
                const _channel3 = this.client.channels.resolve(guildMember.guild.settings.unverifiedChannel);
                if (_channel3) {
                    _channel3.send(`**Welcome new member** <@${guildMember.id}>! As a troll prevention, please check the welcome-unverified channel for instructions on how to get full access to this guild! (note: you cannot see verified members nor many of the channels until you verify yourself.).`)
                }
            } else {
                if (_channel2)
                    _channel2.send(`**Welcome new member** <@${guildMember.id}>! Check out the information channels to learn more about us! Please especially read the rules. `)
            }
        }

        // Re-assign permissions to discipline channels.
        guildMember.guild.channels
            .filter((channel) => channel.topic && channel.topic !== null && channel.topic.startsWith(`Discipline ${guildMember.user.id}`))
            .each((channel) => {
                channel.createOverwrite(guildMember, {
                    ADD_REACTIONS: true,
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                    EMBED_LINKS: true,
                    ATTACH_FILES: true,
                    READ_MESSAGE_HISTORY: true
                }, "Active incident channel; user re-entered the guild.");
                channel.send(`:unlock: This member had (re-)entered the guild. Channel permissions were assigned so they can see it.`);
            });

        const flagLogChannel = this.client.channels.resolve(guildMember.guild.settings.flagLogChannel);
        if (flagLogChannel) {

            // Add a flag log if the member's account is less than 7 days old
            if (moment().subtract(7, 'days').isBefore(moment(guildMember.user.createdAt))) {
                flagLogChannel.send(`:clock7: Member <@${guildMember.user.id}> (${guildMember.user.id}) just joined the guild but their user account is less than 7 days old. Trolls often create new accounts, so keep an eye on them.`)
            }

            // Add a flag log if the member has one or more active modLogs against them.
            if (guildMember.settings.modLogs.length > 0) {
                var logs = guildMember.settings.modLogs.filter((log) => log.valid);
                if (logs.length > 0) {
                    flagLogChannel.send(`:police_officer: Member <@${guildMember.user.id}> (${guildMember.user.id}) just re-joined the guild. Keep an eye on them because they have ${logs.length} discipline records on their account. (they have ${guildMember.HP} HP).`)
                }
            }
        }
    }

};