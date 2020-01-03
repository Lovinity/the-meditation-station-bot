const { Event } = require('klasa');
const _ = require("lodash");
const moment = require("moment");
const config = require('../config.js');

module.exports = class extends Event {

    run () {
        try {
            const owner = this.client.application.owner;
            if (owner) {
                owner.send(`:arrows_counterclockwise: The bot was rebooted and is now ready.`)
            }
        } catch (e) {

        }
        var updateLevels = (guildMember) => {
            // Update level roles
            var levelRoles = {};
            var levelRoles2 = guildMember.guild.settings.levelRoles;
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
                    if (guildMember.guild.roles.has(levelRoles[ levelKey ])) {
                        if (guildMember.settings.xp >= xp && !guildMember.roles.has(levelRoles[ levelKey ])) {
                            rolesToAdd.push(levelRoles[ levelKey ]);
                        } else if (guildMember.settings.xp < xp && guildMember.roles.has(levelRoles[ levelKey ])) {
                            rolesToRemove.push(levelRoles[ levelKey ]);
                        }
                    }
                });

                if (rolesToAdd.length > 0)
                    guildMember.roles.add(rolesToAdd, `Level Update (add roles)`)
                        .then(stuff => {
                            if (rolesToRemove.length > 0)
                                guildMember.roles.remove(rolesToRemove, `Level Update (remove roles)`);
                        });
            }
        }

        // Iterate through guild operations on bot startup
        this.client.guilds.each((guild) => {

            // Kick self if the guild is black listed
            if (!guild.available)
                return;
            if (this.client.settings.guildBlacklist.includes(guild.id)) {
                guild.leave();
                this.client.emit('warn', `Blacklisted guild detected: ${guild.name} [${guild.id}]`);
                return;
            }

            // Add a scheduled task to run every minute for the guild if it does not already exist
            const guildTask = guild.settings.guildTasks;
            if (!guildTask || guildTask === null) {
                this.client.schedule.create('guildtasks', "* * * * *", {
                    data: {
                        guild: guild.id,
                    }
                })
                    .then((task) => {
                        guild.settings.update('guildTasks', task.id);
                    });
            }

            // Cache the last (default #) messages in all channels
            guild.channels.each((channel) => {
                if (channel.type === 'text')
                    channel.messages.fetch();
            });

            // Reset verification roles for specific guild
            if (guild.id === config.verification.guild) {
                (async (_guild) => {
                    var _channel = _guild.channels.resolve(config.verification.channel);
                    if (_channel) {
                        var _message = await _channel.message.fetch(config.verification.message);
                        if (_message) {
                            await _message.reactions.removeAll();
                            await _message.react(`1️⃣`);
                            await _message.react(`2️⃣`);
                            await _message.react(`3️⃣`);
                            await _message.react(`4️⃣`);
                            await _message.react(`5️⃣`);
                            await _message.react(`6️⃣`);
                        }
                    }
                })(guild);
            }

            // Cycle through all the members without the verified role and assign them the stored roles if applicable.
            const verifiedRole = guild.roles.resolve(guild.settings.verifiedRole);
            const muteRole = guild.roles.resolve(guild.settings.muteRole);
            var verified = [];
            const generalChannel = this.client.channels.resolve(guild.settings.generalChannel);
            const _channelMod = this.client.channels.resolve(guild.settings.modLogChannel);
            var inactiveChannel = guild.channels.resolve(guild.settings.inactiveChannel);
            var modLogChannel = guild.channels.resolve(guild.settings.modLogChannel);
            var inactiveRole = guild.roles.resolve(guild.settings.inactiveRole);
            guild.members.each((guildMember) => {

                // Check if the member should be muted. If so, reset all roles
                if (muteRole && (guildMember.settings.muted || guildMember.roles.get(muteRole.id))) {
                    if (!guildMember.roles.get(muteRole.id) && _channelMod)
                        _channelMod.send(`:mute: The member <@!${guildMember.user.id}> had a mute on their account and was re-muted upon the bot restarting. Check to be sure they were not trying to mute evade.`);
                    guildMember.settings.update(`muted`, true, guild);
                    guildMember.roles.set([ guild.settings.muteRole ], `User supposed to be muted`);
                } else {
                    // Member has the verified role. Update database with the current roles set in case anything changed since bot was down.
                    if (verifiedRole && guildMember.roles.get(verifiedRole.id)) {
                        guildMember.settings.update('verified', true);
                        guildMember.settings.reset(`roles`);
                        guildMember.roles.each((role) => {
                            if (role.id !== guild.roles.everyone.id && role.id !== guild.settings.muteRole)
                                guildMember.settings.update(`roles`, role, guild, { action: 'add' });
                        });
                        updateLevels(guildMember);
                        // Member does not have verified role but has passed the verification stage, so add all roles from the database
                    } else if (guildMember.settings.verified) {
                        // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
                        guildMember.roles.set(guildMember.settings.roles, `Re-assigning roles`)
                            .then(() => {
                                // Verify the member if we are not in raid mitigation level 2+
                                if (guild.settings.raidMitigation < 2 && verifiedRole) {
                                    guildMember.roles.add(verifiedRole, `User is verified`);
                                }
                                updateLevels(guildMember);
                            })

                        // Have to do this outside of the then() statement because then() does not hold back completion of this each().
                        if (guild.settings.raidMitigation < 2 && verifiedRole) {
                            verified.push(guildMember.id);
                        }
                    }
                }

                // Check if the member is inactive
                if (!guildMember.user.bot) {
                    if (guildMember.settings.lastMessage === null && moment().diff(moment(guildMember.joinedAt), 'hours') > (24 * 7)) {
                        if (inactiveRole && !guildMember.roles.get(inactiveRole.id)) {
                            guildMember.roles.add(inactiveRole, `New member has not sent a message in the last 7 days.`);
                            if (modLogChannel)
                                modLogChannel.send(`:zzz: New member ${guildMember.user.tag} (${guildMember.id}) has joined over 7 days ago without sending their first message. Marked inactive until they do.`)
                            if (inactiveChannel)
                                inactiveChannel.send(`:zzz: Hey <@${guildMember.id}>; it looks like you joined over 7 days ago but have not yet sent your first message. Say hi in any channel so we know you are not a lurker and wish to remain in our guild.`);
                        }
                    } else if (guildMember.settings.lastMessage !== null && moment().diff(moment(guildMember.settings.lastMessage), 'days') > 30) {
                        if (inactiveRole && !guildMember.roles.get(inactiveRole.id)) {
                            guildMember.roles.add(inactiveRole, `Regular member has not sent any messages in the last 30 days.`);
                            if (modLogChannel)
                                modLogChannel.send(`:zzz: Member ${guildMember.user.tag} (${guildMember.id}) has not sent any messages in the last 30 days. Marked inactive until they do.`)
                            if (inactiveChannel)
                                inactiveChannel.send(`:zzz: Hey <@${guildMember.id}>; you haven't sent any messages in over 30 days. Say hi in any channel so we know you're okay, still around, and want to remain in the guild.`);
                        }
                    } else if (inactiveRole && guildMember.roles.get(inactiveRole.id)) {
                        guildMember.roles.remove(inactiveRole, `Member is no longer inactive`);
                    }
                }
            });

            // Make a message welcoming the new members who have been verified.
            if (generalChannel && verified.length > 0) {
                generalChannel.send(`**Welcome to our new members** ${verified.map((gm) => gm = `<@${gm}> `)}` + "\n\n" + `Sorry about me being sick/offline, but I am back online and verified you. Thank you for your patience. Here are some tips to get started:`)
                    .then(() => {
                        generalChannel.send(`:small_orange_diamond: Be sure to check out the welcome channel for the rules and helpful resources. All members and staff must follow the rules.
:small_orange_diamond: Use the \`!staff\` bot command at any time if you need to talk privately with staff, such as to report another member.
:small_orange_diamond: Use the \`!profile\` bot command to get a link to view and edit your profile! Everyone in the guild gets a bot profile.`);
                    });
            }

            // Remove invites that have no inviter (raid prevention)
            const modLog = guild.settings.eventLogChannel;
            const _channel = guild.channels.resolve(modLog);
            guild.fetchInvites()
                .then(invites => {
                    invites
                        .filter(invite => typeof invite.inviter === 'undefined' || invite.inviter === null)
                        .each((invite) => {
                            invite.delete('This invite has no inviter. Maybe the inviter left the guild?');
                            if (modLog)
                                _channel.send(`:wastebasket: The invite ${invite.code} was deleted because an inviter did not exist. They probably left the guild.`);
                        });

                });
        });


    }

};