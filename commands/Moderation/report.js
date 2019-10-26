/*
 * This command is used to report a conflict in a text channel. If a configured number of members report in a configured amount of time, the bot
 * activates conflict resolution, taking "SEND_MESSAGES" away from everyone for 5 minutes while instructing a breathing exercise, and then
 * proceeding with conflict resolution questions. Used with tasks/conflictstage[2-5].js and tasks/removeconflict.js.
 */
const {Command} = require('klasa');
const moment = require('moment');
const GuildDiscipline = require('../../util/guildDiscipline');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Use this command inside a private incident channel to report a member for violating the rules',
            usage: '<user:username>',
            usageDelim: ' | ',
            cooldown: 30,
            runIn: ['text'],
            requiredPermissions: ["MANAGE_ROLES"],
            requiredSettings: ["reportMembers", "reportTime", "muteRole", "incidentsCategory", "noSelfModRole"],
            extendedHelp: 'When multiple people report the same member in a configured amount of time, the member gets muted for the safety of the community until staff investigate.'
        });
    }

    async run(message, [user]) {
        // Error if this command was not executed in an incidents channel, and delete the message for user's confidentiality
        if (message.channel.parent && message.channel.parent.id !== message.guild.settings.incidentsCategory)
        {
            await message.send(`:x: I don't want others knowing you're reporting someone. Please use the !report command in an incidents channel. You can use the command !staff to create one.`);
            return message.delete({reason: `Use of !report ourside an incidents channel. Deleted for confidentiality.`});
        }

        // First, resolve configured settings
        const reports = user.guildSettings(message.guild.id).reports;
        const reportMembers = message.guild.settings.reportMembers || 3;
        const reportTime = moment().add(parseInt(message.guild.settings.reportTime), 'minutes').toDate();
        const muted = message.guild.settings.muteRole;
        const mutedRole = message.guild.roles.resolve(muted);
        const noSelfMod = message.guild.settings.noSelfModRole;
        const noSelfModRole = message.guild.roles.resolve(noSelfMod);
        const guildMember = message.guild.members.resolve(user.id);
        const incidents = message.guild.settings.incidentsCategory;

        // Check if this specific member used the conflict command on the user recently. If not, add an entry.
        if (reports.indexOf(`${message.author.id}`) === -1)
        {
            // Do not activate the mute if already muted, not in the guild, or not activated by staff and not enough reports made yet
            if (guildMember && guildMember.roles.resolve(mutedRole.id))
                return message.sendMessage(`:x: Your report was acknowledged, but the member is already muted. Please provide reasoning / evidence why you reported this member.`);

            if (guildMember && guildMember.roles.resolve(noSelfModRole.id))
                return message.sendMessage(`:x: I could not acknowledge your report because you had abused the report command in the past. You can still tell us here why you're reporting the member.`);

            // By this point, the report is authorized

            // Add a scheduled task to remove this report after configured minutes.
            const reportsadd = await this.client.schedule.create('removereport', reportTime, {
                data: {
                    guild: message.guild.id,
                    reportee: user.id,
                    reporter: message.author.id
                }
            });

            // Add 10 to the guild's raid score
            message.guild.raidScore(10);

            // Add this report into the member's report records
            await user.guildSettings(message.guild.id).update(`reports`, `${message.author.id}`, {action: 'add'});

            if ((reports.length + 1) < reportMembers)
                return message.sendMessage(`:white_check_mark: Your report was acknowledged. Not enough reports have been made yet for an auto-mute. Please explain why you reported the user here with evidence. Staff may revoke your !report privileges if you do not do so.`);

            var discipline = new GuildDiscipline(user, message.guild, this.client.user)
                    .setType('mute')
                    .setReason(`${reportMembers} members have reported you for misconduct within the last ${reportTime} minutes. This does **not** guarantee you are in trouble; staff will investigate and determine what to do. Please be patient.`);
            discipline = await discipline.prepare();
            await discipline.finalize();

            return message.sendMessage(`:mute: Your report was acknowledged. Other members reported this user, therefore I muted them. Please explain why you reported the user here with evidence. Staff may revoke your !report privileges if you do not do so.`);
        } else {
            return message.sendMessage(`:x: It looks like you already reported this user recently, so I could not acknowledge your report. Feel free to provide any / additional information and evidence of their misconduct in this channel.`);
    }

    }

};



