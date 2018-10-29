const {Event} = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run(guildMember) {

        // Get the configured modLog channel.
        const modLog = guildMember.guild.settings.get('modLogChannel');

        // End if there is no configured channel or the channel is not a text channel
        if (!modLog)
            return;

        const _channel = this.client.channels.get(modLog);

        // send a log to the channel
        _channel.send(`:tada: The member <@!${guildMember.user.id}> just joined the guild. They created their account on ${guildMember.user.createdAt.toUTCString()}`);

        // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
        // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
        var _temp = guildMember.user.settings[guildMember.guild.id].roles;
        if (_temp.length > 0)
        {
            var temp = _.cloneDeep(_temp);
            guildMember.roles.add(temp);
            const _channel2 = this.client.channels.get(guildMember.guild.settings.get('generalChannel'));
            if (_channel2)
            {
                _channel2.send(`**Welcome back** <@${guildMember.id}>! I see you have been here before. I remembered your profile, XP, Yang, reputation, etc. I also re-assigned the roles that you had when you left. Be sure to check out the rules channel; they may have changed since you were last with us.`);
            }
        } else {
            const _channel2 = this.client.channels.get(guildMember.guild.settings.get('generalChannel'));
            if (_channel2)
            {
                _channel2.send(`**Welcome new member** <@${guildMember.id}>! It looks like you've never been here before. Be sure to check out the welcome channel and rules channel. Use the \`!staff\` command if you ever need to talk with staff in private. We hope you enjoy your stay!`);
            }
        }

        // See if there are any pending incidents for this member, and if so, assign permissions to that channel
        const pendIncidents = guildMember.guild.settings.get('pendIncidents');
        if (pendIncidents && pendIncidents.length > 0)
        {
            pendIncidents.forEach(function (incident) {
                if (incident.user === guildMember.id)
                {
                    const channel = this.client.channels.get(incident.channel);
                    if (channel)
                    {
                        var overwrites = [];
                        overwrites.push({
                            id: guildMember.id,
                            allow: [
                                "ADD_REACTIONS",
                                "VIEW_CHANNEL",
                                "SEND_MESSAGES",
                                "EMBED_LINKS",
                                "ATTACH_FILES",
                                "READ_MESSAGE_HISTORY"
                            ],
                            type: 'member'
                        });
                        // Add deny permissions for @everyone
                        overwrites.push({
                            id: this.guild.defaultRole,
                            deny: [
                                "VIEW_CHANNEL",
                            ],
                            type: 'role'
                        });

                        channel.overwritePermissions(overwrites);
                        guildMember.guild.settings.update(`pendIncidents`, incident, {action: 'remove'});
                    }
                }
            });
        }

        // If the guild is under a raid mitigation level 2+, assign the mitigation role to the new member.
        if (guildMember.guild.settings.raidMitigation > 1)
        {
            const raidRole = guildMember.guild.roles.get(guildMember.guild.settings.raidRole);
            if (raidRole)
                guildMember.roles.add(raidRole, `Raid mitigation is active`);
        }

    }

};

