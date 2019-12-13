const { Event } = require('klasa');

module.exports = class extends Event {

    run (oldMember, newMember) {

        // Update the roles in the database
        newMember.settings.reset(`roles`);
        newMember.roles.each((role) => {
            if (role.id !== newMember.guild.roles.everyone.id)
                newMember.settings.update(`roles`, role, newMember.guild, { action: 'add' });
        });

        // Update voice mutes according to whether or not the user is muted.
        var isMuted = (newMember.roles.get(newMember.guild.settings.muteRole));
        var isVerified = (newMember.roles.get(newMember.guild.settings.verifiedRole));
        if (isMuted && newMember.voice.channelID) {
            newMember.voice.kick(`User is muted`)
        }

        // Remove verified role when member is muted; re-add verified role when member is no longer muted if not in a guild raid
        if (newMember.guild.settings.muteRole && newMember.guild.settings.verifiedRole) {
            const verifiedRole = newMember.guild.roles.resolve(newMember.guild.settings.verifiedRole);

            if (isMuted && isVerified && verifiedRole) {
                newMember.roles.remove(verifiedRole, `Member is muted`);
            }

            if (!isMuted && !isVerified && newMember.guild.settings.raidMitigation < 2 && verifiedRole) {
                newMember.roles.add(verifiedRole, `Member no longer muted`);
            }
        }
    }

};

