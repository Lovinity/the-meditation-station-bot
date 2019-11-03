const { Event } = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run () {

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

            // Cycle through all the members without the verified role and assign them the stored roles
            const verified = guild.settings.verifiedRole;
            const verifiedRole = guild.roles.resolve(verified);
            if (verifiedRole) {
                guild.members.each((guildMember) => {
                    // Member has the verified role. Update database with the current roles set in case anything changed since bot was down.
                    if (guildMember.roles.get(verifiedRole.id)) {
                        var roleArray = [];
                        guildMember.settings.reset(`roles`);
                        guildMember.roles.each((role) => {
                            if (role.id !== guild.roles.everyone.id)
                                guildMember.settings.update(`roles`, role, guild, { action: 'add' });
                        });
                        updateLevels(guildMember);
                        // Member does not have verified role, so add all roles from the database
                    } else {
                        // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
                        var _temp = guildMember.settings.roles;
                        var temp = _.cloneDeep(_temp);
                        guildMember.roles.add(temp, `Re-assigning saved roles`)
                            .then(newMember => updateLevels(newMember));

                        // Also if the guild is under a raid mitigation level 2+, assign the mitigation role to the new member.
                        if (guildMember.guild.settings.raidMitigation > 1) {
                            const raidRole = guildMember.guild.roles.resolve(guildMember.guild.settings.raidRole);
                            if (raidRole)
                                guildMember.roles.add(raidRole, `Raid mitigation is active`);
                        }
                    }
                });
            } else {
                guild.members.each((guildMember) => {
                    updateLevels(guildMember);
                });
            }

            // Remove invites that have no inviter (raid prevention)
            const modLog = guild.settings.modLogChannel;
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