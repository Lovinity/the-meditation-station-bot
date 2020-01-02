const { Structures } = require('discord.js');
const moment = require("moment");

Structures.extend('Guild', Guild => class MyGuild extends Guild {

    constructor(...args) {
        super(...args);
        this.raidScore = (score) => {

            // Update the score.
            var currentScore = this.settings.raidScore;
            this.settings.update('raidScore', currentScore + score);
            var newScore = currentScore + score;

            var mitigation = this.settings.raidMitigation;

            // Get announcements channel
            var channel = this.settings.announcementsChannel;
            const _channel = this.client.channels.resolve(channel);

            // Activate raid mitigation if necessary
            if (newScore >= 60 && mitigation < 1) {
                this.setVerificationLevel(3)
                    .then(updated => {
                        this.settings.update('raidMitigation', 1);
                        if (_channel)
                            _channel.send(`:rotating_light: **Raid mitigation level 1 activated** :rotating_light:
    
I have detected a potential raid. As a precaution, level 1 mitigation has been activated. Until raid mitigation ends: New members will remain unverified until raid mitigation ends. New members cannot send messages for the first 10 minutes of joining. And antispam discipline will result in an untimed mute.`);
                    });
            } else if (newScore >= 120 && mitigation < 2) {
                this.setVerificationLevel(4)
                    .then(updated => {
                        this.settings.update('raidMitigation', 2);
                        if (_channel)
                            _channel.send(`:rotating_light: **Raid mitigation level 2 activated** :rotating_light:
    
I continue to detect raid activity. As a further precaution, level 2 mitigation has been activated. Until raid mitigation ends: Members cannot join the guild without a verified phone number on their Discord account. New members will remain unverified until raid mitigation ends. And antispam discipline will result in a 24-hour ban.`);
                    });
            } else if (newScore >= 180 && mitigation < 3) {
                this.settings.update('raidMitigation', 3);
                if (_channel)
                    _channel.send(`@everyone :rotating_light: **Raid mitigation level 3 activated - All invite links deleted** :rotating_light:
    
Severe raid activity continues to be detected. I activated the highest mitigation level (level 3). All invite links have been deleted. Until raid mitigation ends: Members cannot join the guild; invite links created before mitigation ends will be deleted by the bot. And antispam discipline will result in a permanent ban.`);
                this.fetchInvites()
                    .then(invites => {
                        invites.each(invite => {
                            invite.delete();
                        });
                    })
            }
        };
    }

});


