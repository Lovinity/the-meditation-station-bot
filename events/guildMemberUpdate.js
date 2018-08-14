const {Event} = require('klasa');

module.exports = class extends Event {

    run(oldMember, newMember) {

        // Update the roles in the database
        var roleArray = [];
        newMember.roles.each(function (role) {
            if (role.id !== newMember.guild.defaultRole.id)
                roleArray.push(role.id);
        });
        newMember.user.settings.update(`${newMember.guild.id}.roles`, roleArray);
    }

};

