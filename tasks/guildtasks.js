const {Task} = require('klasa');
const moment = require("moment");

module.exports = class extends Task {

    async run( { guild }) {
        const _guild = this.client.guilds.get(guild);
        if (_guild)
        {
            // Antispam cooldown
            var cooldown = _guild.settings.get('antispamCooldown');
            _guild.members.each((guildMember) => {
                var newscore = guildMember.settings.spamscore - cooldown;
                if (newscore < 0)
                    newscore = 0;
                guildMember.settings.update('spamscore', newscore);
            });

            // Do stats
            const statsMessageChannel = _guild.settings.get('statsMessageChannel');
            const statsMessage = _guild.settings.get('statsMessage');

            if (statsMessage && statsMessageChannel)
            {

                // Edit the message containing stats
                var themessage = `:chart_with_upwards_trend: **Current ${_guild.name} Statistics** (edited automatically every minute) :chart_with_upwards_trend: \n\n`;
                themessage = themessage + `Current Guild Time:  **${moment().format('LLLL')}** \n`;
                themessage = themessage + `Number of members in the guild: **${_guild.members.array().length}** \n`;

                _guild.channels.get(statsMessageChannel).messages.fetch(statsMessage)
                        .then(message => message.edit(themessage));
            }

            // Do icebreakers
            var n = new Date();
            var m = n.getMinutes();
            var h = n.getHours();

            if (m === 0 && (h === 6 || h === 12 || h === 18 || h === 0))
            {
                const iceBreakerChannel = _guild.settings.get('iceBreakerChannel');
                const _channel = this.client.channels.get(iceBreakerChannel);
                if (_channel)
                {
                    var iceBreakers = _guild.settings.get('icebreakers');
                    _channel.send(`:snowflake: **Time for another ice breaker question!** :snowflake:
                    
${iceBreakers[Math.floor(Math.random() * iceBreakers.length)]}
`);
                }

            }

            // Delete all invites if under mitigation level 3
            if (_guild && _guild.settings.raidMitigation >= 3)
            {
                _guild.fetchInvites()
                        .then(invites => {
                            invites.each(invite => {
                                invite.delete();
                            });
                        })
            }

            // Raid score cool-down
            var newscore = _guild.settings.raidscore - 1;
            if (newscore < 0)
                newscore = 0;
            _guild.settings.update('raidscore', newscore);

            // Raid mitigation ends
            if (newscore <= 0 && _guild.settings.raidMitigation > 0)
            {
                var channel = _guild.settings.announcementsChannel;
                const _channel = this.client.channels.get(channel);
                if (_channel)
                {
                    var response = `:ballot_box_with_check: **Raid mitigation has ended** :ballot_box_with_check: 

I do not detect raid activity anymore. Raid mitigation has ended.
                    
All new members now have full access to the guild.
Verification is now set down to high (must wait 10 minutes after joining before new users can talk)
Level 3: **Please remember to re-generate invite links if mitigation level was 3**. I do not re-generate those automatically.`;
                    _channel.send(response);
                }

                // Remove raidRole
                _guild.members.each(function (guildMember) {
                    var raidRole = _guild.roles.get(_guild.settings.raidRole);
                    if (raidRole)
                    {
                        if (guildMember.roles.get(raidRole.id))
                        {
                            guildMember.roles.remove(raidRole, `Raid mitigation expired`);
                        }
                    }
                });

                // Reset verification level
                _guild.setVerificationLevel(3);

                // Disable mitigation in settings
                _guild.settings.update('raidMitigation', 0);
            }

            // Check for voice channel listening and award XP for listeners
            _guild.channels
                    .filter((channel) => channel.type === 'voice')
                    .each((channel) => {
                        var award = false;
                        var awardTo = [];
                        channel.members
                                .each((guildMember) => {
                                    // Is the member undeaf and not a bot? They deserve a listening award!
                                    if (!guildMember.voice.deaf && !guildMember.user.bot)
                                        awardTo.push(guildMember);
                                    // Is the member unmuted and not a bot? Award listening XP/Yang to qualified members (if no one is unmuted, no one gets rewarded)
                                    if (!guildMember.voice.mute && !guildMember.user.bot)
                                        award = true;
                                });
                                
                        // Award XP to everyone who qualifies if the channel as a whole qualifies
                        if (award && awardTo.length > 0)
                        {
                            awardTo.forEach((guildMember) => {
                                guildMember.xp(1);
                            });
                        }
                    });
    }
    }

};

