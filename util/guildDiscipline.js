// This class constructs and issues a discipline against a guild member via the user extension
const ModLog = require('./modLog');
const moment = require('moment');

module.exports = class GuildDiscipline {

    constructor(user, guild, responsible) {
        this.client = guild.client;
        this.user = user;
        this.guild = guild;
        this.responsible = responsible;
        this.reason = `No reason specified; please contact staff of ${guild.name}`;
        this.xp = 0;
        this.yang = 0;
        this.reputation = 0;
        this.other = null;
        this.duration = 0;
        this.type = 'discipline';
        this.channel = null;
        this.message = null;
    }

    setReason (reason = null) {
        if (reason instanceof Array)
            reason = reason.join('; ');
        this.reason = reason;
        return this;
    }

    setXp (xp) {
        this.xp = xp;
        return this;
    }

    setYang (yang) {
        this.yang = yang;
        return this;
    }

    setReputation (reputation) {
        this.reputation = reputation;
        return this;
    }

    setOther (other = null) {
        if (other instanceof Array)
            other = other.join('; ');
        this.other = other;
        return this;
    }

    setDuration (minutes) {
        this.duration = minutes;
        return this;
    }

    setType (type) {
        this.type = type;
        return this;
    }

    // prepare the discipline while the staff is still going through the wizard.
    async prepare () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        var guildMember = this.guild.members.resolve(this.user.id);

        if (this.type === 'mute' || this.type === 'preban' || this.type === 'tempban' || this.type === 'ban') {
            // Add the mute role to the user, if the user is in the guild
            if (guildMember) {
                guildMember.roles.add(mutedRole, this.reason);
            } else {
                // Otherwise, add mutedRole to the list of roles for the user so it's applied when/if they return
                this.user.guildSettings(this.guild.id).update(`roles`, mutedRole, this.guild, { action: 'add' });
            }
        }

        // Create an incidents channel if configuration permits
        const incidents = this.guild.settings.incidentsCategory;
        if (incidents) {
            // Create an incidents channel between the muted user and staff, first grant permissions for the user
            var overwrites = [];
            if (guildMember) {
                overwrites.push({
                    id: guildMember.id,
                    allow: [
                        "ADD_REACTIONS",
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "EMBED_LINKS",
                        "ATTACH_FILES",
                        "READ_MESSAGE_HISTORY"
                    ],
                    type: 'member'
                });
            }

            // Add deny permissions for @everyone
            overwrites.push({
                id: this.guild.roles.everyone,
                deny: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            });

            // Process permission overwrites for staff
            if (this.guild.settings.modRole) {
                overwrites.push({
                    id: this.guild.settings.modRole,
                    allow: [
                        "ADD_REACTIONS",
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "MANAGE_MESSAGES",
                        "MENTION_EVERYONE",
                        "MANAGE_ROLES",
                        "EMBED_LINKS",
                        "ATTACH_FILES",
                        "READ_MESSAGE_HISTORY"
                    ],
                    type: 'role'
                });
            }


            // Create the incidents channel
            this.channel = await this.guild.channels.create('int_d', {
                type: 'text',
                topic: `Discipline ${this.user.username}#${this.user.discriminator}, responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`,
                parent: incidents,
                permissionOverwrites: overwrites,
                rateLimitPerUser: 15,
                reason: `Discipline ${this.user.username}#${this.user.discriminator}, responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`
            });

            // rename it to its own ID
            await this.channel.setName(`int_d_${this.channel.id}`, `Incident assigned ID ${this.channel.id}`);

            // Send an initial message to the channel
            this.message = await this.channel.send(`:hourglass_flowing_sand: <@${this.user.id}>, staff are filling out an incident report regarding something you recently did in the guild. ${(this.type === 'mute' || this.type === 'preban' || this.type === 'tempban' || this.type === 'ban' ? "You have been muted in the guild for the time being for the safety of the community. " : "It is advised to refrain from engaging elsewhere in the guild for the moment. ")}More information will be provided to you shortly; please wait while staff finish telling me all the information to pass to you.`);
        }

        return this;
    }

    // Execute when the discipline wizard has been completed by staff
    async finalize () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        var guildMember = this.guild.members.resolve(this.user.id);

        // Init the message
        const msg = ``; // Intro / reason
        const msg2 = "The following discipline has been issued: \n\n"; // Discipline / Accountability
        const msg3 = ``; // Appeals / Closing / not in the guild

        // Update the incidents channel with relevant information
        if (this.message !== null)
            await this.message.delete();
        switch (this.type) {
            case 'warn':
                msg += ":warning: **__You have been issued a formal warning__** :warning: \n\n"
                msg += "Everyone wants to enjoy their time here. But something you did recently was a bit out of line. You are being issued a formal warning for the following: \n"
                msg += `**${this.reason}**` + "\n\n"
                msg += "Staff would like to see you work on this concern and learn from this encounter. Staff may need to issue discipline if this happens again."

                msg2 = ""

                msg3 += "If you need assistance, or have any questions or concerns about this warning, feel free to post in this private channel with staff. They will be happy to help you. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this warning in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this warning final and unappealable."
                msg3 += "Thank you for your understanding and cooperation."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add permissions to this channel if/when I detect them re-entering the guild."

                break;
            case 'discipline':
                msg += ":octagonal_sign: **__You have been issued discipline__** :octagonal_sign: \n\n"
                msg += "We all make mistakes, but everyone wants to enjoy their experience here. Something you did recently was out of line. You are being issued discipline for the following: \n"
                msg += `**${this.reason}**` + "\n\n"
                msg += "Staff would like to see you work on this concern and learn from this encounter. Staff may need to issue more severe discipline if this happens again."

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this discipline in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable."
                msg3 += "Thank you for your understanding and cooperation."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add permissions to this channel if/when I detect them re-entering the guild."

                break;
            case 'mute':
                msg += ":mute: **__You have been muted for a while__** :mute: \n\n"
                msg += "We all make mistakes, but everyone wants to enjoy their experience here. Something you did recently was out of line. You are being issued an extended mute for the following: \n"
                msg += `**${this.reason}**` + "\n\n"
                msg += "Staff would like to see you work on this concern and learn from this encounter. Staff may need to issue more severe discipline if this happens again."

                msg2 += "**Mute** \n"
                msg2 += `You have been muted from the guild ${this.duration === 0 ? 'until staff manually remove the muted role from you' : `until ${moment().add(this.duration, 'minutes').format("LLLL Z")}`} (${this.duration} minutes from now)` + "\n\n"

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this discipline in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this discipline final and unappealable."
                msg3 += "Thank you for your understanding and cooperation."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nI will add the mute and permissions to this channel if/when I detect them re-entering the guild."

                break;
            case 'tempban':
                msg += ":no_entry: **__You have been banned temporarily from the guild__** :no_entry: \n\n"
                msg += "We know you can do better than this. We are disappointed we have had to go as far as to temp-ban you. You are being temp-banned for the following: \n"
                msg += `**${this.reason}**` + "\n\n"
                msg += "Staff would like to see you work on this concern and learn from this encounter. Staff may need to issue a permanent ban if this happens again."

                msg2 += "**Temporary Ban** \n"
                msg2 += `Once you leave the guild, a ban will be placed on you, which will be removed by the bot in ${this.duration / (60 * 24)} days. Your temp-ban time will not begin until you leave the guild or get kicked; until then, you will remain muted.` + "\n\n"

                msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here prior to leaving (once you leave, you will lose access to the server until the suspension ends). If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                msg3 += "**You have 48 hours to dispute this temp ban in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this temp ban final and unappealable."
                msg3 += "Thank you for your understanding and cooperation."

                if (!guildMember)
                    msg3 += "\n\n**User not in the guild**\nThe temp ban was applied immediately."
                break;
            case 'ban':
                    msg += ":no_entry_sign: **__You have been banned from the guild indefinitely__** :no_entry_sign: \n\n"
                    msg += "Your conduct in the guild cannot be tolerated any longer. Therefore, for the safety of the community, you are being indefinitely removed from the guild. We wish you the best in your adventures and hope you enjoyed your stay in this guild. You are being banned for the following: \n"
                    msg += `**${this.reason}**`
    
                    msg2 += "**Ban** \n"
                    msg2 += `Once you leave the guild, a server ban will be placed on you. This ban will remain in place indefinitely or until staff manually remove it. Until you leave or staff kick you, you will remain muted.` + "\n\n"
    
                    msg3 += "This channel is private between you and staff; you may communicate any questions or concerns you have here prior to leaving (once you leave, you will lose access to the guild). If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful. \n"
                    msg3 += "**You have 48 hours to dispute this ban in this text channel if you feel it was wrongly issued**. Leaving the guild, being disrespectful towards staff, or trying to discuss the matter outside of this channel will automatically make this ban final and unappealable."
                    msg3 += "Thank you for your understanding and cooperation."
    
                    if (!guildMember)
                        msg3 += "\n\n**User not in the guild**\nThe ban was applied immediately."
                break;
        }

        // prepare a modLog
        var modLog = await new ModLog(this.guild)
            .setType(this.type)
            .setModerator(this.responsible)
            .setUser(this.user)
            .setReason(this.reason)
            .setDiscipline({
                xp: this.xp,
                yang: this.yang,
                reputation: this.reputation,
                schedule: null
            })
            .setOtherDiscipline(this.other);

        // Add a schedule if a mute is in place
        if (this.duration > 0 && this.type === 'mute') {
            const removemute = await this.client.schedule.create('removemute', moment().add(this.duration, 'minutes').toDate(), {
                data: {
                    user: this.user.id,
                    guild: this.guild.id,
                    role: mutedRole.id,
                    incidentsChannel: (this.channel !== null && this.channel.id) ? this.channel.id : null
                }
            });
            await modLog.setDiscipline({
                xp: this.xp,
                yang: this.yang,
                reputation: this.reputation,
                schedule: removemute.id
            });
            if (this.duration > 0)
                await modLog.setExpiration(moment().add(this.duration, 'minutes').toISOString(true));
        }

        // Issue discipline
        if (this.xp > 0) {
            msg2 += `**Loss of ${this.xp} XP**` + " \n"
            msg2 += `Your XP is now at ${(this.user.guildSettings(this.guild.id).xp - this.xp)}` + "\n\n"

            await this.user.guildSettings(this.guild.id).update(`xp`, (this.user.guildSettings(this.guild.id).xp - this.xp));

            // Update level roles
            var guildMember = this.guild.members.resolve(this.user);
            if (guildMember) {
                var levelRoles = {};
                var levelRoles2 = guildMember.guild.settings.levelRoles;
                for (var key in levelRoles2) {
                    if (levelRoles2.hasOwnProperty(key)) {
                        if (levelRoles2[ key ] === null)
                            continue;
                        levelRoles[ key.replace('level', '') ] = levelRoles2[ key ];
                    }
                }
                var levelKeys = Object.keys(levelRoles);
                if (levelKeys.length > 0) {
                    var rolesToAdd = [];
                    var rolesToRemove = [];
                    levelKeys.map(levelKey => {
                        var xp = Math.ceil(((levelKey - 1) / 0.177) ** 2);
                        if (guildMember.guild.roles.has(levelRoles[ levelKey ])) {
                            if (guildMember.settings.xp >= xp && !guildMember.roles.has(levelRoles[ levelKey ])) {
                                rolesToAdd.push(levelRoles[ levelKey ]);
                            } else if (guildMember.settings.xp < xp && guildMember.roles.has(levelRoles[ levelKey ])) {
                                rolesToRemove.push(levelRoles[ levelKey ]);
                            }
                        }
                    });

                    if (rolesToAdd.length > 0)
                        guildMember.roles.add(rolesToAdd, `Level Update (add roles)`)
                            .then(stuff => {
                                if (rolesToRemove.length > 0)
                                    guildMember.roles.remove(rolesToRemove, `Level Update (remove roles)`);
                            });
                }
            }
        }
        if (this.yang > 0) {
            msg2 += `**Loss of ${this.yang} Yang**` + " \n"
            msg2 += `Your Yang balance is now at ${(this.user.guildSettings(this.guild.id).yang - this.yang)}` + "\n\n"

            this.user.guildSettings(this.guild.id).update(`yang`, (this.user.guildSettings(this.guild.id).yang - this.yang));
        }
        if (this.reputation > 0) {
            msg2 += `**${this.reputation} bad reputation added to profile**` + " \n"
            msg2 += `Your reputation is now ${this.user.guildSettings(this.guild.id).goodRep} good / ${(this.user.guildSettings(this.guild.id).badRep + this.reputation)} bad` + "\n\n"

            this.user.guildSettings(this.guild.id).update(`badRep`, (this.user.guildSettings(this.guild.id).badRep + this.reputation));
        }
        if (this.other !== null) {
            msg2 += `**Accountability / Additional Discipline**` + " \n"
            msg2 += `${this.other}` + "\n\n"
        }

        // If the member is no longer in the guild, issue the ban or tempban immediately, and undo the mute
        if (!guildMember) {
            if (this.type !== 'tempban' && this.type !== 'ban')
                await this.guild.settings.update('pendIncidents', { channel: this.channel.id, user: this.user.id }, { action: 'add' });
            if (this.type === 'tempban' || this.type === 'ban') {
                await this.guild.members.ban(this.user, { days: 7, reason: this.reason });
                this.user.guildSettings(this.guild.id).update(`roles`, mutedRole, this.guild, { action: 'remove' });
                if (this.type === 'tempban') {
                    // Add a schedule if the mute is limited duration
                    if (this.duration > 0) {
                        const removeban = await this.client.schedule.create('removeban', moment().add(this.duration, 'minutes').toDate(), {
                            data: {
                                user: this.user.id,
                                guild: this.guild.id,
                                incidentsChannel: (this.channel !== null && this.channel.id) ? this.channel.id : null
                            }
                        });
                        await modLog.setDiscipline({
                            xp: this.xp,
                            yang: this.yang,
                            reputation: this.reputation,
                            schedule: removeban.id
                        });
                        await modLog.setExpiration(moment().add(this.duration, 'minutes').toISOString(true));
                    }
                }
            }
        }

        // Add 30 to the raid score for permanent bans and temp bans
        if (this.type === 'ban' || this.type === 'tempban')
            this.guild.raidScore(30);

        // Add 20 to the raid score for mutes
        if (this.type === 'mute')
            this.guild.raidScore(20);

        modLog = await modLog.setChannel(this.channel)

        // Push out the mod log
        modLog = await modLog.send();

        if (guildMember) {
            if (this.type === 'tempban')
                await this.guild.settings.update('pendSuspensions', { user: this.user.id, reason: this.reason, duration: this.duration, channel: this.channel.id, case: modLog }, { action: 'add' });
            if (this.type === 'ban')
                await this.guild.settings.update('pendBans', { user: this.user.id, reason: this.reason, channel: this.channel.id, case: modLog }, { action: 'add' });
        }

        // Push out discipline message
        this.channel.send(msg + "\n\n" + msg2 + msg3, {
            split: true,
            reply: this.user
        })

        return this;
    }

    // Called when the staff member fails to complete the wizard
    async cancel () {
        // Get the configured muted role
        const muted = this.guild.settings.muteRole;
        const mutedRole = this.guild.roles.resolve(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        // Remove the mute role
        var guildMember = this.guild.members.resolve(this.user.id);

        if (this.type === 'ban' || this.type === 'tempban' || this.type === 'mute') {
            if (guildMember) {
                guildMember.roles.remove(mutedRole, `Staff did not complete discipline wizard.`);
            } else if (this.type === 'mute') {
                // Otherwise, remove mutedRole to the list of roles for the user so it's applied when/if they return
                this.user.guildSettings(this.guild.id).update(`roles`, mutedRole, this.guild, { action: 'remove' });
            }
        }
        await this.message.delete();
        await this.channel.send(`:ok_hand: The staff member who was working on your discipline has decided against issuing any discipline. We apologize for any inconvenience this caused you. If you were muted, the mute was removed.`);
        return this;
    }

};


