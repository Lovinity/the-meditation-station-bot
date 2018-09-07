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
        const verified = guildMember.guild.settings.get(`verifiedRole`);
        const verifiedRole = guildMember.guild.roles.get(verified);
        if (verifiedRole)
        {
            // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
            var _temp = guildMember.user.settings[guildMember.guild.id].roles;
            var temp = _.cloneDeep(_temp);
            temp.push(verifiedRole.id);
            guildMember.roles.add(temp);
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
                            allowed: [
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
                            denied: [
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
        
        // If the guild is under a raid mitigation, assign the mitigation role to the new member.
        if (guildMember.guild.settings.raidMitigation > 0)
        {
            const raidRole = guildMember.guild.roles.get(guildMember.guild.settings.raidRole);
            if (raidRole)
                guildMember.roles.add(raidRole, `Raid mitigation is active`);
        }

    }

};

