const { Event } = require('klasa');

module.exports = class extends Event {

    constructor(...args) {
        super(...args, {
            enabled: true,
        });
    }

    async run (oldState, newState) {
        console.log(`Voice state update`)
        if (newState.member && oldState.channelID !== newState.channelID && newState.channelID) {

            // Check if the member is muted. If so, update voice mute as well.
            var isMuted = (newState.member.roles.get(newState.guild.settings.muteRole));
            if (isMuted) {
                newState.kick(`User is muted`)
            }
        }
    }

};