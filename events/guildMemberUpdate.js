const { Event } = require('klasa');

module.exports = class extends Event {

    async run (oldMember, newMember) {

        // Upgrade partial new members to full members,
        if (newMember.partial) {
            await newMember.fetch();
        }

        const mutedRole = newMember.guild.roles.resolve(newMember.guild.settings.muteRole);
        if (mutedRole) {
            var isMuted = (newMember.roles.cache.get(newMember.guild.settings.muteRole) ? true : false);
            var wasMuted = (oldMember.partial ? false : oldMember.roles.cache.get(oldMember.guild.settings.muteRole) ? true : false);

            // Kick the user out of voice channels if they are muted
            if (isMuted && newMember.voice.channelID) {
                newMember.voice.kick(`User is muted`)
            }

            // If newly muted, or muted with more than 1 role, or not muted when they should be muted, remove all roles except muted.
            if ((!wasMuted && isMuted) || (isMuted && newMember.roles.size > 2) || (!isMuted && !wasMuted && newMember.settings.muted)) {
                await newMember.settings.update(`muted`, true, newMember.guild);
                // Remove all roles except the muted role
                newMember.roles.set([ newMember.guild.settings.muteRole ], `User muted; remove all other roles`);

            } else if (wasMuted && !isMuted) { // User was muted and is no longer muted; re-assign roles.
                await newMember.settings.update(`muted`, false, newMember.guild);
                newMember.roles.set(newMember.settings.roles, `User no longer muted; apply previous roles`);

            } else if (!isMuted && !wasMuted && !oldMember.partial && !oldMember.roles.cache.get(oldMember.guild.settings.unsafeRole) && !newMember.roles.cache.get(newMember.guild.settings.unsafeRole)) { // User not, nor was, muted, nor is unsafe; update role database
                newMember.settings.reset(`roles`);
                newMember.roles.each((role) => {
                    if (role.id !== newMember.guild.roles.everyone.id && role.id !== newMember.guild.settings.muteRole)
                        newMember.settings.update(`roles`, role, newMember.guild, { action: 'add' });
                });
            }
        } else if (!oldMember.partial && !oldMember.roles.cache.get(oldMember.guild.settings.unsafeRole) && !newMember.roles.cache.get(newMember.guild.settings.unsafeRole)) {
            newMember.settings.reset(`roles`);
            newMember.roles.each((role) => {
                if (role.id !== newMember.guild.roles.everyone.id)
                    newMember.settings.update(`roles`, role, newMember.guild, { action: 'add' });
            });
        }

        const unsafeRole = newMember.guild.roles.resolve(newMember.guild.settings.unsafeRole);
        if (unsafeRole) {
            if (!newMember.roles.cache.get(newMember.guild.settings.muteRole)) {
                var isUnsafe = (newMember.roles.cache.get(newMember.guild.settings.unsafeRole) ? true : false);
                var wasUnsafe = (oldMember.partial ? false : oldMember.roles.cache.get(oldMember.guild.settings.unsafeRole) ? true : false);

                // If newly unsafe, or unsafe with more than 1 role, or not unsafe when they should be unsafe, remove all roles except unsafe.
                if ((!wasUnsafe && isUnsafe) || (isUnsafe && newMember.roles.size > 2) || (!isUnsafe && !wasUnsafe && newMember.settings.unsafe)) {
                    await newMember.settings.update(`unsafe`, true, newMember.guild);
                    // Remove all roles except the muted role
                    newMember.roles.set([ newMember.guild.settings.unsafeRole ], `User unsafe; remove all other roles`);

                } else if (wasUnsafe && !isUnsafe) { // User was unsafe and is no longer unsafe; re-assign roles.
                    await newMember.settings.update(`unsafe`, false, newMember.guild);
                    newMember.roles.set(newMember.settings.roles, `User no longer unsafe; apply previous roles`);
                }
            } else if (newMember.roles.cache.get(newMember.guild.settings.unsafeRole)) {
                newMember.roles.remove(unsafeRole, `Member is muted; cannot be unsafe at this time.`);
            }
        }
    }

};

