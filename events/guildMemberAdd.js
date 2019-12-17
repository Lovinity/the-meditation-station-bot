const { Event } = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run (_guildMember) {

        // Re-fetch guild member to update settings before operations
        _guildMember.guild.members.fetch(guildMember.id)
            .then((guildMember) => {

                console.dir(guildMember.settings);

                // Get the configured modLog channel.
                const modLog = guildMember.guild.settings.eventLogChannel;

                const _channel = this.client.channels.resolve(modLog);

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
                    guildMember.settings.update(`muted`, true, guild);
                    guildMember.roles.set([ guild.settings.muteRole ], `User supposed to be muted`);
                } else {
                    // Re-assign saved roles
                    if (guildMember.settings.roles.length > 0) {
                        guildMember.roles.set(guildMember.settings.roles, `Re-assigning roles`)
                            .then(() => {
                                // Verify the member if we are not in raid mitigation level 2+
                                if (guildMember.guild.settings.raidMitigation < 2 && verifiedRole) {
                                    guildMember.roles.add(verifiedRole, `User is verified`);
                                }

                                if (_channel2)
                                    _channel2.send(`**Welcome back** <@${guildMember.id}>! I see you have been here before. I remembered your profile, XP, Yang, reputation, badges, profile info, roles, etc. Be sure to check out the welcome channel; the rules may have changed since you were last with us.`)
                                updateLevels(guildMember);
                            })
                    } else {
                        // Verify the member if we are not in raid mitigation level 2+
                        if (guildMember.guild.settings.raidMitigation < 2 && verifiedRole) {
                            if (_channel2)
                                _channel2.send(`**Welcome new member** <@${guildMember.id}>! It looks like you've never been here before. We love new friends! Here are some tips to get started:
:small_orange_diamond: Be sure to check out the welcome channel for the rules and helpful resources. All members and staff must follow the rules.
:small_orange_diamond: Use the \`!staff\` bot command at any time if you need to talk privately with staff, such as to report another member
:small_orange_diamond: Use the \`!profile\` bot command to get a link to view and edit your profile! Everyone in the guild gets a bot profile.`);
                            guildMember.roles.add(verifiedRole, `User is verified`);
                        } else {
                            const _channel3 = this.client.channels.resolve(guildMember.guild.settings.unverifiedChannel);
                            if (_channel3)
                                _channel3.send(`**Welcome new member** <@${guildMember.id}>! Please stand by; the guild is experiencing a raid and therefore you do not have full guild access yet. You may talk with staff and other new members here. Once the raid ends (hopefully within an hour or two), all new members will get full guild access.`)
                        }
                    }
                }

                // See if there are any pending incidents for this member, and if so, assign permissions to that channel
                const pendIncidents = guildMember.guild.settings.pendIncidents;
                if (pendIncidents && pendIncidents.length > 0) {
                    pendIncidents.map((incident) => {
                        if (incident.user === guildMember.id) {
                            const channel = this.client.channels.resolve(incident.channel);
                            if (channel) {
                                channel.createOverwrite(guildMember, {
                                    ADD_REACTIONS: true,
                                    VIEW_CHANNEL: true,
                                    SEND_MESSAGES: true,
                                    EMBED_LINKS: true,
                                    ATTACH_FILES: true,
                                    READ_MESSAGE_HISTORY: true
                                }, "Active incident channel; user re-entered the guild.");
                                guildMember.guild.settings.update(`pendIncidents`, incident, { action: 'remove' });
                            }
                        }
                    });
                }

            });
    }

};

