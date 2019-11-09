const {Event} = require('klasa');

module.exports = class extends Event {

    run(oldMember, newMember) {

        // Update the roles in the database
        newMember.settings.reset(`roles`);
        newMember.roles.each((role) => {
            if (role.id !== newMember.guild.roles.everyone.id)
                newMember.settings.update(`roles`, role, newMember.guild, {action: 'add'});
        });

        // Update voice mutes according to whether or not the user is muted.
        var isMuted = (newMember.roles.get(newMember.guild.settings.muteRole));
        if (isMuted && newMember.voice.channelID) {
            newMember.voice.kick(`User is muted`)
        }
    }

};

