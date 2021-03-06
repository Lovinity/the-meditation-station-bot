const { Event } = require('klasa');

module.exports = class extends Event {

    constructor(...args) {
        super(...args, {
            enabled: true,
        });
    }

    async run (oldState, newState) {
        console.log(`Voice state update`)

        // Fetch partials
        if (newState.member.partial) await newState.member.fetch();

        if (newState.member && newState.channelID && (oldState.member.partial || oldState.channelID !== newState.channelID)) {

            // Check if the member is muted. If so, kick them out of the voice channel.
            var isMuted = (newState.member.settings.muted);
            if (isMuted) {
                newState.kick(`User is muted`)
            }

            // Check if the member has a restriction on voice channel use. If so, kick them.
            if (newState.member.settings.restrictions.cannotUseVoiceChannels)
            {
                newState.kick('Use is not allowed to use voice channels');
                const generalChannel = this.client.channels.resolve(newState.guild.settings.generalChannel);

                // Add some spam score to prevent the potential of someone spamming the general channel by means of quickly and repeatedly trying to join a voice channel.
                newState.member.spamScore(25);
                if (generalChannel) {
                    var msg = await generalChannel.send(`:lock: Sorry <@${newState.member.id}>. But you are not allowed to use the voice channels. Warning: Repeatedly trying to access the voice channels will trigger the antispam system.`);
                    setTimeout(() => {
                        msg.delete();
                    }, 15000);
                }
            }
        }
    }

};