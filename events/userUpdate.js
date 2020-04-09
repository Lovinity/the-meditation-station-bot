const { Event } = require('klasa');

module.exports = class extends Event {

    async run (oldUser, newUser) {

        if (newUser.partial) {
            await newUser.fetch();
        }

        // Add event logs to guilds if things changed
        this.client.guilds.cache
            .filter((guild) => guild.members.resolve(newUser.id))
            .each((guild) => {
                const eventLogChannel = this.client.channels.resolve(guild.settings.eventLogChannel);
                if (eventLogChannel) {
        
                    // Add an event log if the user's tag changed
                    if (!oldUser.partial && oldUser.tag !== newUser.tag) {
                        eventLogChannel.send(`:star_struck: Member <@${newUser.id}> (${newUser.id}) changed their username from ${oldUser.tag} to ${newUser.tag}.`)
                    }

                    // Add an event log if the user's avatar changed
                    if (!oldUser.partial && oldUser.avatar !== newUser.avatar) {
                        eventLogChannel.send(`:face_with_monocle: Member <@${newUser.id}> (${newUser.id}) changed their avatar.` + "\n" + `Old: ${oldUser.displayAvatarURL()}` + "\n" + `New: ${newUser.displayAvatarURL()}`)
                    }
                }
            })
    }

};
