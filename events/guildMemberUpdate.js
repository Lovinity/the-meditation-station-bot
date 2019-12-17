const { Event } = require('klasa');

module.exports = class extends Event {

    run (oldMember, newMember) {
        console.log(`Member update`);
        
        console.dir(oldMember);
        console.dir(newMember);

        var isMuted = (newMember.roles.get(newMember.guild.settings.muteRole));
        var wasMuted = (oldMember.roles.get(oldMember.guild.settings.muteRole));

        // Kick the user out of voice channels if they are muted
        if (isMuted && newMember.voice.channelID) {
            newMember.voice.kick(`User is muted`)
        }

        // If newly muted, or muted with more than 1 role, or not muted when they should be muted, remove all roles except muted.
        if ((!wasMuted && isMuted) || (isMuted && newMember.roles.size > 1) || (!isMuted && !wasMuted && newMember.settings.muted)) {
            newMember.settings.update(`muted`, true, newMember.guild);
            // Remove all roles except the muted role
            newMember.roles.set([ newMember.guild.settings.muteRole ], `User muted; remove all other roles`);

        } else if (wasMuted && !isMuted) { // User was muted and is no longer muted; re-assign roles.
            newMember.settings.update(`muted`, false, newMember.guild);
            newMember.roles.set(newMember.settings.roles, `User no longer muted; apply previous roles`);

        } else if (!isMuted && !wasMuted) { // User not, nor was, muted; update role database
            newMember.settings.reset(`roles`);
            newMember.roles.each((role) => {
                if (role.id !== newMember.guild.roles.everyone.id)
                    newMember.settings.update(`roles`, role, newMember.guild, { action: 'add' });
            });
        }
    }

};

