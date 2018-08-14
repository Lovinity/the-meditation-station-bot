const {Event} = require('klasa');

module.exports = class extends Event {

    run(guildMember) {

        // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
        const verified = guildMember.guild.settings.get(`verifiedRole`);
        const verifiedRole = guildMember.guild.roles.get(verified);
        if (verifiedRole)
        {
            guildMember.settings.roles.forEach(function (role) {
                guildMember.roles.add(role);
            });
            guildMember.roles.add(verifiedRole);
        }

    }

};

