const {Event} = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run(guildMember) {

        // Get the configured modLog channel.
        const modLog = guildMember.guild.settings.eventLogChannel;

        const _channel = this.client.channels.resolve(modLog);

        // send a log to the channel
        if (_channel)
            _channel.send(`:tada: The member <@!${guildMember.user.id}> just joined the guild. They created their account on ${guildMember.user.createdAt.toUTCString()}`);

        // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
        // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
        var _temp = guildMember.settings.roles;
        if (_temp.length > 0)
        {
            var temp = _.cloneDeep(_temp);

            guildMember.roles.add(temp)
                    .then(newMember => updateLevels(newMember));
            const _channel2 = this.client.channels.resolve(guildMember.guild.settings.generalChannel);
            if (_channel2)
            {
                _channel2.send(`**Welcome back** <@${guildMember.id}>! I see you have been here before. I remembered your profile, XP, Yang, reputation, etc. I also re-assigned the roles that you had when you left. Be sure to check out the rules channel; they may have changed since you were last with us.`);
            }
        } else {
            updateLevels(guildMember);
            const _channel2 = this.client.channels.resolve(guildMember.guild.settings.generalChannel);
            if (_channel2)
            {
                _channel2.send(`**Welcome new member** <@${guildMember.id}>! It looks like you've never been here before. Be sure to check out the welcome channel and rules channel. Use the \`!staff\` command if you ever need to talk with staff in private. We hope you enjoy your stay!`);
            }
        }

        // See if there are any pending incidents for this member, and if so, assign permissions to that channel
        const pendIncidents = guildMember.guild.settings.pendIncidents;
        if (pendIncidents && pendIncidents.length > 0)
        {
            pendIncidents.map((incident) => {
                if (incident.user === guildMember.id)
                {
                    const channel = this.client.channels.resolve(incident.channel);
                    if (channel)
                    {
                        channel.createOverwrite(guildMember, {
                            ADD_REACTIONS: true,
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true,
                            EMBED_LINKS: true,
                            ATTACH_FILES: true,
                            READ_MESSAGE_HISTORY: true
                        }, "Active incident channel; user re-entered the guild.");
                        guildMember.guild.settings.update(`pendIncidents`, incident, {action: 'remove'});
                    }
                }
            });
        }

        // If the guild is under a raid mitigation level 2+, assign the mitigation role to the new member.
        if (guildMember.guild.settings.raidMitigation > 1)
        {
            const raidRole = guildMember.guild.roles.resolve(guildMember.guild.settings.raidRole);
            if (raidRole)
                guildMember.roles.add(raidRole, `Raid mitigation is active`);
        }

        var updateLevels = (_guildMember) => {
            // Update level roles
            var levelRoles = {};
            var levelRoles2 = _guildMember.guild.settings.levelRoles;
            for (var key in levelRoles2)
            {
                if (levelRoles2.hasOwnProperty(key))
                {
                    if (levelRoles2[key] === null)
                        continue;
                    levelRoles[key.replace('level', '')] = levelRoles2[key];
                }
            }
            var levelKeys = Object.keys(levelRoles);
            if (levelKeys.length > 0)
            {
                var rolesToAdd = [];
                var rolesToRemove = [];
                levelKeys.map(levelKey => {
                    var xp = Math.ceil(((levelKey - 1) / 0.177) ** 2);
                    if (_guildMember.guild.roles.has(levelRoles[levelKey]))
                    {
                        if (_guildMember.settings.xp >= xp && !_guildMember.roles.has(levelRoles[levelKey]))
                        {
                            rolesToAdd.push(levelRoles[levelKey]);
                        } else if (_guildMember.settings.xp < xp && _guildMember.roles.has(levelRoles[levelKey])) {
                            rolesToRemove.push(levelRoles[levelKey]);
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
    }

};

