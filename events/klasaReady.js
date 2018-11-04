const {Event} = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run() {

        // Iterate through guild operations on bot startup
        this.client.guilds.each(function (guild) {

            // Cache the last (default #) messages in all channels
            guild.channels.each(function (channel) {
                if (channel.type === 'text')
                    channel.messages.fetch();
            });

            // Cycle through all the members without the verified role and assign them the stored roles
            const verified = guild.settings.verifiedRole;
            const verifiedRole = guild.roles.get(verified);
            if (verifiedRole)
            {
                guild.members.each(function (guildMember) {
                    // Member has the verified role. Update database with the current roles set in case anything changed since bot was down.
                    if (guildMember.roles.get(verifiedRole.id))
                    {
                        var roleArray = [];
                        guildMember.roles.each(function (role) {
                            if (role.id !== guild.defaultRole.id)
                                roleArray.push(role.id);
                        });
                        guildMember.settings.update(`roles`, roleArray);
                        // Member does not have verified role, so add all roles from the database
                    } else {
                        // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
                        var _temp = guildMember.settings.roles;
                        var temp = _.cloneDeep(_temp);
                        guildMember.roles.add(temp, `Re-assigning saved roles`);

                        // Also if the guild is under a raid mitigation level 2+, assign the mitigation role to the new member.
                        if (guildMember.guild.settings.raidMitigation > 1)
                        {
                            const raidRole = guildMember.guild.roles.get(guildMember.guild.settings.raidRole);
                            if (raidRole)
                                guildMember.roles.add(raidRole, `Raid mitigation is active`);
                        }
                    }
                });
            }

            // Remove invites that have no inviter (raid prevention)
            const modLog = guild.settings.modLogChannel;
            const _channel = guild.channels.get(modLog);
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