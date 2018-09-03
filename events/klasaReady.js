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
            const verified = guild.settings.get(`verifiedRole`);
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
                        guildMember.user.settings.update(`${guild.id}.roles`, roleArray);
                        // Member does not have verified role, so add all roles from the database, and then add the verified role
                    } else {
                        // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
                        var _temp = guildMember.user.settings[guild.id].roles;
                        var temp = _.cloneDeep(_temp);
                        temp.push(verifiedRole.id);
                        guildMember.roles.add(temp);
                    }
                });
            }
        });


    }

};