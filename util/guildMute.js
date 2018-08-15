// This class constructs and issues a mute against a guild member via the user extension (so you can mute users not currently in the guild)

const {MessageEmbed} = require('discord.js');
const ModLog = require('./modLog');
const moment = require('moment');

module.exports = class GuildMute {

    constructor(user, guild, responsible) {
        this.client = guild.client;
        this.user = user;
        this.guild = guild;
        this.responsible = responsible;
        this.reason = `No reason specified; please contact staff of ${guild.name}`;
        this.duration = null;
    }

    setReason(reason = null) {
        if (reason instanceof Array)
            reason = reason.join('; ');
        this.reason = reason;
        return this;
    }

    setDuration(minutes) {
        this.duration = moment().add(minutes, 'minutes').toDate();
        return this;
    }

    // Execute the mute

    async execute() {
        // Get the configured muted role
        const muted = this.guild.settings.get(`muteRole`);
        const mutedRole = this.guild.roles.get(muted);

        // error if there is no muted role
        if (!mutedRole)
            throw `muteRole must be configured for this guild before mutes can be issued`;

        // Create a Mod Log
        var modLog = new ModLog(this.guild)
                .setType('mute')
                .setModerator(this.responsible)
                .setUser(this.user)
                .setReason(this.reason);

        if (this.duration !== null)
            modLog.setExpiration(moment(this.duration).toISOString(true));

        modLog.send();

        // Add the mute role to the user, if the user is in the guild
        var guildMember = this.guild.members.get(this.user.id);
        if (guildMember)
        {
            guildMember.roles.add(mutedRole, `Mute issued to member`);
        } else {
            // Otherwise, add mutedRole to the list of roles for the user so it's applied when/if they return
            this.user.settings.update(`${this.guild.id}.roles`, mutedRole.id, {action: 'add'});
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
                    allowed: [
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
                denied: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            });

            // Create the incidents channel
            var channel = await this.guild.channels.create('int_m', {
                type: 'text',
                topic: `Mute issued to ${this.user.username}#${this.user.discriminator} by ${this.responsible.username}#${this.responsible.discriminator}`,
                parent: incidents,
                overwrites: overwrites,
                reason: `Mute issued to ${this.user.username}#${this.user.discriminator} by ${this.responsible.username}#${this.responsible.discriminator}`
            });

            // rename it to its own ID
            await channel.setName(`int_m_${channel.id}`, `Incident assigned ID ${channel.id}`);

            // Send a message in the channel
            await channel.send(`:mute: **__You have been muted__** :mute:
                
Hello <@!${this.user.id}>,
You have been muted from the guild for the following reason(s): ${this.reason}
Your mute will expire ${this.duration === null ? 'when staff conclude this investigation / manually unmute you' : `at ${moment(this.duration).format("LLLL Z")}`}.
You may use this private channel between you and the staff to communicate any concerns or questions you have regarding this mute. Please be respectful, or staff may issue more severe discipline.
           
Thank you for your understanding and cooperation.
            
${guildMember ? '' : `<@!${this.responsible.id}> **NOTE: this user is currently not in the guild and will not see this channel until you manually set permissions**.`}
`);
        }

        // Add a schedule if the mute is limited duration
        if (this.duration !== null)
        {
            const removemute = await this.client.schedule.create('removemute', this.duration, {
                data: {
                    user: this.user.id,
                    guild: this.guild.id,
                    role: mutedRole.id,
                    incidentsChannel: (channel && channel.id) ? channel.id : null
                }
            });
        }

    }

};




