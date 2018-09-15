// This class constructs and issues a discipline against a guild member via the user extension

const {MessageEmbed} = require('discord.js');
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

    setReason(reason = null) {
        if (reason instanceof Array)
            reason = reason.join('; ');
        this.reason = reason;
        return this;
    }

    setXp(xp) {
        this.xp = xp;
        return this;
    }

    setYang(yang) {
        this.yang = yang;
        return this;
    }

    setReputation(reputation) {
        this.reputation = reputation;
        return this;
    }

    setOther(other = null) {
        if (other instanceof Array)
            other = other.join('; ');
        this.other = other;
        return this;
    }

    setDuration(minutes) {
        this.duration = minutes;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    // prepare the discipline while the staff is still going through the wizard.
    async prepare() {
        // Get the configured muted role
        const muted = this.guild.settings.get(`muteRole`);
        const mutedRole = this.guild.roles.get(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        var guildMember = this.guild.members.get(this.user.id);

        if (this.type === 'mute' || this.type === 'preban' || this.type === 'ban')
        {
            // Add the mute role to the user, if the user is in the guild
            if (guildMember)
            {
                guildMember.roles.add(mutedRole, this.reason);
            } else {
                // Otherwise, add mutedRole to the list of roles for the user so it's applied when/if they return
                this.user.settings.update(`${this.guild.id}.roles`, mutedRole.id, {action: 'add'});
            }
        }

        // Create an incidents channel if configuration permits
        const incidents = this.guild.settings.get(`incidentsCategory`);
        if (incidents)
        {
            // Create an incidents channel between the muted user and staff, first grant permissions for the user
            var overwrites = [];
            if (guildMember)
            {
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
                id: this.guild.defaultRole,
                deny: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            });

            // Process permission overwrites for staff
            if (this.guild.settings.modRole)
            {
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
                topic: `Incident of ${this.user.username}#${this.user.discriminator}, responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`,
                parent: incidents,
                overwrites: overwrites,
                reason: `Incident of ${this.user.username}#${this.user.discriminator}, responsible mod: ${this.responsible.username}#${this.responsible.discriminator}`
            });

            // rename it to its own ID
            await this.channel.setName(`int_d_${this.channel.id}`, `Incident assigned ID ${this.channel.id}`);

            // Send an initial message to the channel
            this.message = await this.channel.send(`:hourglass_flowing_sand: <@${this.user.id}>, a recent incident involving you occurred in the guild/server. ${(this.type === 'mute' || this.type === 'preban' || this.type === 'ban' ? "You have been muted in the guild/server for the time being for the safety of the community. " : "")}More information will be provided to you shortly; please wait while staff finish filling out information via the bot.`);
        }

        return this;
    }

    // Execute when the discipline wizard has been completed by staff
    async finalize() {
        // Get the configured muted role
        const muted = this.guild.settings.get(`muteRole`);
        const mutedRole = this.guild.roles.get(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        var guildMember = this.guild.members.get(this.user.id);

        // Init the message embed
        const embed = new MessageEmbed();

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
                    schedule: null})
                .setOtherDiscipline(this.other);

        // Add a schedule if a mute is in place
        if (this.duration > 0 && this.type === 'mute')
        {
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
                schedule: removemute.id});
            if (this.duration > 0)
                await modLog.setExpiration(moment().add(this.duration, 'minutes').toISOString(true));
        }

        // Issue discipline
        if (this.xp > 0)
        {
            embed.addField(`You lost ${this.xp} XP`, `Your XP is now at ${(this.user.settings[this.guild.id].xp - this.xp)}`);
            this.user.settings.update(`${this.guild.id}.xp`, (this.user.settings[this.guild.id].xp - this.xp));
        }
        if (this.yang > 0)
        {
            embed.addField(`You lost ${this.yang} Yang`, `Your Yang balance is now at ${(this.user.settings[this.guild.id].yang - this.yang)}`);
            this.user.settings.update(`${this.guild.id}.yang`, (this.user.settings[this.guild.id].yang - this.yang));
        }
        if (this.reputation > 0)
        {
            embed.addField(`${this.reputation} bad reputation was assessed on your profile`, `Your reputation is now +${this.user.settings[this.guild.id].goodRep} / -${(this.user.settings[this.guild.id].badRep + this.reputation)}`);
            this.user.settings.update(`${this.guild.id}.badRep`, (this.user.settings[this.guild.id].badRep + this.reputation));
        }
        if (this.other !== null)
        {
            embed.addField(`Other discipline`, `${this.other}`);
        }

        // If the member is no longer in the guild, issue the ban or tempban immediately, and undo the mute
        if (!guildMember) {
            if (this.type !== 'tempban' && this.type !== 'ban')
                await this.guild.settings.update('pendIncidents', {channel: this.channel.id, user: this.user.id}, {action: 'add'});
            if (this.type === 'tempban' || this.type === 'ban')
            {
                await this.guild.members.ban(this.user, {days: 7, reason: this.reason});
                this.user.settings.update(`${this.guild.id}.roles`, mutedRole.id, {action: 'remove'});
                if (this.type === 'tempban')
                {
                    // Add a schedule if the mute is limited duration
                    if (this.duration > 0)
                    {
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
                            schedule: removeban.id});
                        await modLog.setExpiration(moment().add(this.duration, 'minutes').toISOString(true));
                    }
                }
            }
        }

        // Add 30 to the raid score for permanent bans and temp bans
        if (this.type === 'ban' || this.type === 'tempban')
            this.guild.raidScore(30);

        // Add 15 to the raid score for mutes
        if (this.type === 'mute')
            this.guild.raidScore(15);

        // Push out the mod log
        modLog = await modLog.send();

        if (guildMember)
        {
            if (this.type === 'tempban')
                await this.guild.settings.update('pendSuspensions', {user: this.user.id, reason: this.reason, duration: this.duration, channel: this.channel.id, case: modLog}, {action: 'add'});
            if (this.type === 'ban')
                await this.guild.settings.update('pendBans', {user: this.user.id, reason: this.reason, channel: this.channel.id, case: modLog}, {action: 'add'});
        }

        // Update the incidents channel with relevant information
        if (this.message !== null)
            await this.message.delete();
        switch (this.type)
        {
            case 'warn':
                embed
                        .setTitle(`:warning: You have been issued a warning :warning:`)
                        .setDescription(`We all make mistakes, and that is okay; we're human. The staff want you to be aware of an incident that occurred that is concerning. Therefore, you have been issued a warning.
Please review the below information. Staff would like to see you work on this concern, and learn from this encounter. Staff may need to issue discipline if this happens again.           
If you need assistance, or have any questions or concerns about this warning, feel free to post in this private channel with staff. They will be happy to help you. But please remain respectful.
Thank you for your understanding and cooperation.`)
                        .setColor(16564545)
                        .setFooter(`Reason/Information: ${this.reason}`);

                if (!guildMember)
                    embed.addField(`This user is not currently in the guild` `<@!${this.responsible.id}>, I will add permissions to this channel if/when I detect them re-entering the guild.`);

                await this.channel.send(`<@!${this.user.id}>`, {embed});
                break;
            case 'discipline':
                embed
                        .setTitle(`:octagonal_sign: You have been issued discipline :octagonal_sign:`)
                        .setDescription(`We all make mistakes, and staff do not like having to discipline their members. However, we need to hold you accountable for a recent incident in the guild/server.  Please review the below information carefully and use it as a tool to help improve your conduct.
This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful.
Thank you for your understanding and cooperation.`)
                        .setColor(8421631)
                        .setFooter(`Reason/Information: ${this.reason}`);

                if (!guildMember)
                    embed.addField(`This user is not currently in the guild` `<@!${this.responsible.id}>, I will add permissions to this channel if/when I detect them re-entering the guild.`);

                await this.channel.send(`<@!${this.user.id}>`, {embed});
                break;
            case 'mute':
                embed
                        .setTitle(`:mute: You have been muted :mute:`)
                        .setDescription(`We all make mistakes, and staff do not like having to discipline their members. However, we need to hold you accountable for a recent incident in the guild/server.  Please review the below information carefully and use it as a tool to help improve your conduct.
This channel is private between you and staff; you may communicate any questions or concerns you have here. If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful.
Thank you for your understanding and cooperation.`)
                        .addField(`Duration of Mute`, `The mute will expire ${this.duration === 0 ? 'when staff conclude this investigation / manually remove the Muted role' : `at ${moment().add(this.duration, 'minutes').format("LLLL Z")}`}`)
                        .setColor(15014476)
                        .setFooter(`Reason/Information: ${this.reason}`);

                if (!guildMember)
                    embed.addField(`This user is not currently in the guild` `<@!${this.responsible.id}>, the mute will be applied if they re-enter the guild before it expires. I will add permissions to this channel if/when I detect them re-entering the guild.`);

                await this.channel.send(`<@!${this.user.id}>`, {embed});
                break;
            case 'tempban':
                embed
                        .setTitle(`:no_entry: You have been suspended from the guild temporarily :no_entry:`)
                        .setDescription(`A recent incident has resulted in you earning a suspension. We really do not like having to suspend out members. But it is in our hopes that this suspension will give you some time to reflect on this incident before coming back.
This channel is private between you and staff; you may communicate any questions or concerns you have here prior to leaving (once you leave, you will lose access to the server until the suspension ends). If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful.
Thank you for your understanding and cooperation.`)
                        .addField(`Suspension Duration / Procedure`, `Once you leave the guild/server, a ban will be placed on you, which will be removed by the bot in ${this.duration / (60 * 24)} days. Your suspension time will not begin until you leave the guild/server or get kicked; until then, you will remain muted.`)
                        .setColor(16573465)
                        .setFooter(`Reason/Information: ${this.reason}`);

                if (!guildMember)
                    embed.addField(`This user is not currently in the guild` `<@!${this.responsible.id}>, the suspension was applied immediately.`);

                await this.channel.send(`<@!${this.user.id}>`, {embed});
                break;
            case 'ban':
                embed
                        .setTitle(`:no_entry_sign: You have been banned from the guild :no_entry_sign:`)
                        .setDescription(`It is with great regret to inform you that you have been banned from the guild/server. We hope you enjoyed your experiences here, and wish you the best of luck on your future adventures.
This channel is private between you and staff; you may communicate any questions or concerns you have here prior to leaving (once you leave, you will lose access to the server). If you need help resolving this incident, staff are happy to provide some tips and guidance. But please remain respectful.
Thank you for your understanding and cooperation.`)
                        .addField(`Ban Procedure`, `Once you leave the guild/server, a server ban will be placed on you. This ban will remain in place indefinitely. Until you leave or staff kick you, you will remain muted.`)
                        .setColor(16724253)
                        .setFooter(`Reason/Information: ${this.reason}`);

                if (!guildMember)
                    embed.addField(`This user is not currently in the guild` `<@!${this.responsible.id}>, the ban was applied immediately.`);

                await this.channel.send(`<@!${this.user.id}>`, {embed});
                break;
        }

        return this;
    }

    // Called when the staff member fails to complete the wizard
    async cancel() {
        // Get the configured muted role
        const muted = this.guild.settings.get(`muteRole`);
        const mutedRole = this.guild.roles.get(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before discipline can be issued.`;

        // Remove the mute role
        var guildMember = this.guild.members.get(this.user.id);

        if (this.type === 'ban' || this.type === 'tempban' || this.type === 'mute')
        {
            if (guildMember)
            {
                guildMember.roles.remove(mutedRole, `Staff did not complete discipline wizard.`);
            } else if (this.type === 'mute') {
                // Otherwise, remove mutedRole to the list of roles for the user so it's applied when/if they return
                this.user.settings.update(`${this.guild.id}.roles`, mutedRole.id, {action: 'remove'});
            }
        }
        await this.message.delete();
        await this.channel.send(`:cry: The responsible staff canceled the discipline wizard, so no action will be taken. We apologize for the inconvenience this caused you.`);
        return this;
    }

};


