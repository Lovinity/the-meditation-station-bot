/*
 * This command is used to report a conflict in a text channel. If a configured number of members report in a configured amount of time, the bot
 * activates conflict resolution, taking "SEND_MESSAGES" away from everyone for 5 minutes while instructing a breathing exercise, and then
 * proceeding with conflict resolution questions. Used with tasks/conflictstage[2-5].js and tasks/removeconflict.js.
 */
const { Command } = require('klasa');
const moment = require('moment');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Use this command inside a private incident channel to report a member for violating the rules',
            usage: '<user:username>',
            usageDelim: ' | ',
            cooldown: 30,
            runIn: [ 'text' ],
            requiredPermissions: [ "MANAGE_ROLES" ],
            requiredSettings: [ "reportMembers", "reportTime", "muteRole", "incidentsCategory" ],
            extendedHelp: 'When multiple people report the same member in a configured amount of time, the member gets muted for the safety of the community until staff investigate.'
        });
    }

    async run (message, [ user ]) {
        // Error if this command was not executed in an incidents channel, and delete the message for user's confidentiality
        if (message.channel.parent && message.channel.parent.id !== message.guild.settings.incidentsCategory) {
            await message.send(`:x: For confidentiality, you need to first use the !staff command, and then you can use the !report command inside the created text channel.`);
            return message.delete({ reason: `Use of !report outside an incidents channel. Deleted for confidentiality.` });
        }

        // First, resolve configured settings
        var settings = await user.guildSettings(message.guild.id);
        const reports = settings.reports;
        const reportMembers = message.guild.settings.reportMembers || 3;
        const reportTime = moment().add(parseInt(message.guild.settings.reportTime), 'minutes').toDate();
        const guildMember = message.guild.members.resolve(user.id);

        // Reporter is not allowed to report.
        if (message.member.settings.restrictions.cannotUseReportCommand)
            return message.send(`:lock: Sorry, but you are not allowed to use the report command due to past abuse. You can still post evidence of the member violating the rules in this channel for staff to investigate.`);

        if (!guildMember)
            return message.send(`:x: The member you were trying to report is no longer in the guild, so I could not acknowledge your report. However, you can still provide evidence here for staff to investigate; staff can still take action despite the member having left the guild.`);

        // Check if this specific member used the conflict command on the user recently. If not, add an entry.
        if (reports.indexOf(`${message.author.id}`) === -1) {

            // Reported member is already muted.
            if (guildMember && guildMember.roles.get(mutedRole.id))
                return message.send(`:x: The member is already muted, therefore the report command was not acknowledged. However, you can still provide evidence here for staff to investigate.`);

            // By this point, the report is authorized

            // Add a scheduled task to remove this report after configured minutes.
            const reportsadd = await this.client.schedule.create('removereport', reportTime, {
                data: {
                    guild: message.guild.id,
                    reportee: user.id,
                    reporter: message.author.id
                }
            });

            // Add 5 to the guild's raid score
            message.guild.raidScore(5);

            // Add this report into the member's report records
            await settings.update(`reports`, `${message.author.id}`, { action: 'add' });

            if ((reports.length + 1) < reportMembers)
                return message.sendMessage(`:white_check_mark: Your report was acknowledged. Not enough reports have been made yet for an auto-mute. Please explain why you reported the user here with evidence. Staff may revoke your !report privileges if you do not do so.`);

            // Create a proper response message
            var response = `:mute: **__You have been muted due to multiple reports by other members__** :mute: 

${reportMembers} members have reported you for misconduct within the last ${reportTime} minutes. This does **not** guarantee you are in trouble, and this mute does not constitute discipline on your account; staff will investigate and determine what to do. Please be patient.`;

            var overwrites = [ {
                id: user.id,
                allow: [
                    "ADD_REACTIONS",
                    "VIEW_CHANNEL",
                    "SEND_MESSAGES",
                    "EMBED_LINKS",
                    "ATTACH_FILES",
                    "READ_MESSAGE_HISTORY"
                ],
                type: 'member'
            },
            {
                id: message.channel.guild.roles.everyone,
                deny: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            } ];

            if (message.guild.settings.modRole) {
                overwrites.push({
                    id: message.guild.settings.modRole,
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

            const muted = message.guild.settings.muteRole;
            const mutedRole = message.guild.roles.resolve(muted);

            if (mutedRole) {
                if (guildMember) {
                    guildMember.roles.add(mutedRole, `Mute via several !report s`);
                } else {
                    await settings.update(`muted`, true, message.guild);
                }
            }

            var channel = await message.guild.channels.create(`reported-${Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97)}`, {
                type: 'text',
                topic: `Member ${user.tag} reported multiple times by users.`,
                parent: message.guild.settings.incidentsCategory,
                permissionOverwrites: overwrites,
                rateLimitPerUser: 15,
                reason: `!report initiated by multiple member reports`
            });

            await channel.send(response);

            return message.send(`:mute: Your report was acknowledged. Other members reported this user, therefore I muted them. Please explain why you reported the user here with evidence. Staff may revoke your !report privileges if you do not do so.`);
        } else {
            return message.send(`:x: It looks like you already reported this user recently, so I could not acknowledge your report. Feel free to provide any / additional information and evidence of their misconduct in this channel.`);
        }

    }

};



