const {Structures} = require('discord.js');
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
                if (newScore >= 60 && mitigation < 1)
                {
                    this.setVerificationLevel(4)
                            .then(updated => {
                                this.settings.update('raidMitigation', 1);
                                if (_channel)
                                    _channel.send(`:rotating_light: **Raid mitigation level 1 activated** :rotating_light:
    
I have detected a potential raid. As a precaution, level 1 mitigation has been activated. All new members must have a verified phone number associated with their account until mitigation expires. In addition, antispam mutes issued during level 1 mitigation will last until staff manually remove them instead of 30 minutes. If no more activity is detected, mitigation should end in about one hour. If raid activity continues, higher levels will be activated.`);
                            });
                } else if (newScore >= 120 && mitigation < 2)
                {
                    this.settings.update('raidMitigation', 2);
                    if (_channel)
                        _channel.send(`:rotating_light: **Raid mitigation level 2 activated** :rotating_light:
    
I continue to detect raid activity. As a further precaution, level 2 mitigation has been activated. All new members will be isolated in a channel with staff until mitigation ends. In addition, triggering the antispam system during level 2 mitigation will result in an automatic 1-day suspension. If no more raid-like activity is detected, mitigation should end in about 2 hours. If raid activity continues, higher levels will be activated.`);
                } else if (newScore >= 180 && mitigation < 3) {
                    this.settings.update('raidMitigation', 3);
                    if (_channel)
                        _channel.send(`@everyone :rotating_light: **Raid mitigation level 3 activated - All invite links deleted** :rotating_light:
    
Serious raid activity continues to be detected. I activated the highest mitigation level. All invite links have been deleted, and any new invite links created before mitigation ends will also get deleted. In addition, triggering the antispam during level 3 mitigation will result in an automatic permanent ban. If no more raid activity is detected, mitigation should end in about 3 hours. Please do not forget to re-generate your invite links after mitigation ends.`);
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


