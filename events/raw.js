const { Event } = require('klasa');
const GuildDiscipline = require('../util/guildDiscipline');
const config = require('../config.js');
const moment = require('moment');

module.exports = class extends Event {

    async run (data) {
        // console.log(data);

        // Check for selfrole reactions (this is in the raw event because we want it to work even on uncached messages)
        if (data.t === "MESSAGE_REACTION_ADD") {
            var guild = this.client.guilds.resolve(data.d.guild_id);
            var member;
            var channel;
            var message;
            if (guild) {
                member = await guild.members.fetch(data.d.user_id);
                channel = guild.channels.resolve(data.d.channel_id);
                if (channel)
                    message = await channel.messages.fetch(data.d.message_id);
            }

            // Self roles
            if (guild && member && data.d.user_id !== this.client.user.id && data.d.channel_id === guild.settings.selfRolesChannel) {
                var roles = await guild.roles.fetch();
                roles.each((role) => {
                    if (role.settings.self.message === `${data.d.channel_id}/${data.d.message_id}` && (role.settings.self.reaction === `${data.d.emoji.name}:${data.d.emoji.id}` || role.settings.self.reaction == data.d.emoji.name.codePointAt(0))) {
                        if (!member.roles.get(role.id)) {
                            member.roles.add(role, `Added self role`);
                            if (channel && member) {
                                member.spamScore(5);
                                channel.send(`:white_check_mark: <@${member.id}>, the ${role.name} role was **added** to you.`)
                                    .then((msg) => {
                                        setTimeout(() => {
                                            msg.delete();
                                        }, 10000);
                                    });
                            }
                        } else {
                            member.roles.remove(role, `Removed self role`);
                            if (channel && member) {
                                member.spamScore(5);
                                channel.send(`:white_check_mark: <@${member.id}>, the ${role.name} role was **removed** from you.`)
                                    .then((msg) => {
                                        setTimeout(() => {
                                            msg.delete();
                                        }, 10000);
                                    });
                            }
                        }

                        (async (_role) => {
                            var _channel = guild.channels.resolve(data.d.channel_id);
                            if (_channel) {
                                var _message = await _channel.messages.fetch(data.d.message_id);
                                if (_message) {
                                    _message.reactions
                                        .map((reaction) => {
                                            if (_role.settings.self.reaction === `${reaction.emoji.name}:${reaction.emoji.id}` || _role.settings.self.reaction == reaction.emoji.name.codePointAt(0)) {
                                                reaction.users.remove(data.d.user_id);
                                            }
                                        })
                                }
                            }
                        })(role);
                    }
                });
            }

            // Verification question for a specific guild, must be manually configured

            if (config.verification.message === `${data.d.channel_id}/${data.d.message_id}` && guild && member && message) {
                message.reactions
                    .map((reaction) => {
                        reaction.users.remove(data.d.user_id);
                    });
                if (!member.settings.verified) {
                    if (config.verification.correct === data.d.emoji.name.codePointAt(0)) {
                        member.settings.update('verified', true);
                        const verifiedRole = guild.roles.resolve(guild.settings.verifiedRole);
                        if (!verifiedRole)
                            return null;
                        const _channel2 = this.client.channels.resolve(guild.settings.generalChannel);
                        if (guild.settings.raidMitigation < 2) {
                            if (_channel2)
                                _channel2.send(`<@${member.id}> is now verified! We love new friends! Here are some tips to get started:
    :small_orange_diamond: Be sure to check out the welcome channel for the rules and helpful resources. All members and staff must follow the rules.
    :small_orange_diamond: Use the \`!staff\` bot command at any time if you need to talk privately with staff, such as to report another member.
    :small_orange_diamond: Use the \`!profile\` bot command to get a link to view and edit your profile! Everyone in the guild gets a bot profile.`);
                            member.roles.add(verifiedRole, `User is verified`);
                        } else {
                            const _channel3 = this.client.channels.resolve(guild.settings.unverifiedChannel);
                            if (_channel3)
                                _channel3.send(`<@${member.id}>, **you have been verified**! Unfortunately, the guild is still under a raid. You will get full guild access once the bot has determined the raid to be over. This should hopefully be no more than a couple of hours. Thank you for your patience.`)
                        }
                    } else { // Automatic mute discipline for choosing the wrong gender!
                        member.settings.update('verified', true); // Still verify them among the discipline because verification is a one-shot thing.
                        var discipline = new GuildDiscipline(member.user, guild, this.client.user)
                            .setType('classD')
                            .setReason(`You did not correctly answer the verification question. You are flagged as a potential troll.`)
                            .setMuteDuration(0)
                            .setClassD({
                                apology: false,
                                research: `You must write a research paper explaining what the following gender identities are: Woman, Man, Trans Woman, Trans Man, Agender, Genderfluid, and Genderqueer. You must also include in your research paper how/why gender is distinctly different from sex.`,
                                retraction: false,
                                quiz: false
                            })
                            .setOther(`After completing your research paper, staff will again ask you the same or a similar verification question. You must complete your research paper within 7 days, and get the verification question correct on the second try, to be allowed full guild access.`)
                            .addRule(5);
                        discipline.prepare()
                            .then(prepared => {
                                prepared.finalize();
                            });
                    }
                }
            }

        }
    }

};
