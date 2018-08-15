// This class constructs and issues a warning against a guild member via the user extension (so you can mute users not currently in the guild)

const {MessageEmbed} = require('discord.js');
const ModLog = require('./modLog');
const moment = require('moment');

module.exports = class GuildWarn {

    constructor(user, guild, responsible) {
        this.client = guild.client;
        this.user = user;
        this.guild = guild;
        this.responsible = responsible;
        this.reason = `No reason specified; please contact staff of ${guild.name}`;
    }

    setReason(reason = null) {
        if (reason instanceof Array)
            reason = reason.join('; ');
        this.reason = reason;
        return this;
    }

    // Execute the mute

    async execute() {

        // Create a Mod Log
        var modLog = new ModLog(this.guild)
                .setType('warn')
                .setModerator(this.responsible)
                .setUser(this.user)
                .setReason(this.reason);

        modLog.send();

        var guildMember = this.guild.members.get(this.user.id);

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
            var channel = await this.guild.channels.create('int_w', {
                type: 'text',
                topic: `Warning issued to ${this.user.username}#${this.user.discriminator} by ${this.responsible.username}#${this.responsible.discriminator}`,
                parent: incidents,
                overwrites: overwrites,
                reason: `Warning issued to ${this.user.username}#${this.user.discriminator} by ${this.responsible.username}#${this.responsible.discriminator}`
            });

            // rename it to its own ID
            await channel.setName(`int_w_${channel.id}`, `Incident assigned ID ${channel.id}`);

            // Send a message in the channel
            await channel.send(`:warning: **__You have been issued a formal warning__** :warning:
                
Hello <@!${this.user.id}>,
This is a formal staff warning, issued to you for the following reason(s): ${this.reason}.
Continued misconduct may result in more severe discipline at the discretion of staff.
You may use this private channel between you and the staff to communicate any concerns or questions you have regarding this warning. Please be respectful.
            
Thank you for your understanding and cooperation.
            
${guildMember ? '' : `<@!${this.responsible.id}> **NOTE: this user is currently not in the guild and will not see this channel until you manually set permissions**.`}
`);
        }

    }

};







