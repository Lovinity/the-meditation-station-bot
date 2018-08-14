const {Event} = require('klasa');
const _ = require("lodash");

module.exports = class extends Event {

    run(guildMember) {

        // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
        const verified = guildMember.guild.settings.get(`verifiedRole`);
        const verifiedRole = guildMember.guild.roles.get(verified);
        if (verifiedRole)
        {
            // We have to lodash clone the roles before we start adding them, otherwise guildMemberUpdate will interfere with this process
            var _temp = guildMember.settings.roles;
            var temp = _.cloneDeep(_temp);
            temp.forEach(function (role) {
                guildMember.roles.add(role);
            });
            guildMember.roles.add(verifiedRole);
        }

    }

};

