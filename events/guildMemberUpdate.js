const {Event} = require('klasa');

module.exports = class extends Event {

    run(oldMember, newMember) {

        // Update the roles in the database
        newMember.settings.reset(`roles`);
        newMember.roles.each((role) => {
            if (role.id !== newMember.guild.defaultRole.id)
                newMember.settings.update(`roles`, role, newMember.guild, {action: 'add'});
        });

    }

};

