/*
 * This command is used to report a conflict in a text channel. If a configured number of members report in a configured amount of time, the bot
 * activates conflict resolution, taking "SEND_MESSAGES" away from everyone for 5 minutes while instructing a breathing exercise, and then
 * proceeding with conflict resolution questions. Used with tasks/conflictstage[2-5].js and tasks/removeconflict.js.
 */
const {Command} = require('klasa');
const moment = require('moment');
const GuildMute = require('../../util/guildMute');

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

    async run(msg, [user]) {
        // Error if this command was not executed in an incidents channel, and delete the message for user's confidentiality
        if (msg.channel.parent && msg.channel.parent.id !== msg.guild.settings.get('incidentsCategory'))
        {
            await msg.send(`:x: For your confidentiality, the report command may only be used in an incident channel (private channel between you and the staff). Please use the command !staff to create one.`);
            return msg.delete({reason: `Use of !report ourside an incidents channel. Deleted for confidentiality.`});
        }

        // First, get configured settings
        const reports = user.settings.get(`${msg.guild.id}.reports`);
        const reportMembers = msg.guild.settings.get('reportMembers') || 3;
        const reportTime = moment().add(parseInt(msg.guild.settings.get('reportTime')), 'minutes').toDate();
        const muted = msg.guild.settings.get(`muteRole`);
        const mutedRole = msg.guild.roles.get(muted);
        const noSelfMod = msg.guild.settings.get(`noSelfModRole`);
        const noSelfModRole = msg.guild.roles.get(noSelfMod);
        const guildMember = msg.guild.members.get(user.id);
        const incidents = msg.guild.settings.get(`incidentsCategory`);

        // Check if this specific member used the conflict command on the user recently. If not, add an entry.
        if (reports.indexOf(`${msg.author.id}`) === -1)
        {
            // Do not activate the mute if already muted, not in the guild, or not activated by staff and not enough reports made yet
            if (guildMember && guildMember.roles.get(mutedRole.id))
                return msg.sendMessage(`:warning: Thank you for your report. The member is already muted. Please use this channel to provide any further information or evidence of their misconduct.`);

            if (guildMember && guildMember.roles.get(noSelfModRole.id))
                return msg.sendMessage(`:warning: Thank you for your report. Unfortunately, you have the No Self Mod role, which means your report will not count towards muting the user. But you can continue to use this channel to provide information or evidence of their misconduct.`);

            // By this point, the report is authorized

            // Add a scheduled task to remove this report after configured minutes.
            const reportsadd = await this.client.schedule.create('removereport', reportTime, {
                data: {
                    guild: msg.guild.id,
                    reportee: user.id,
                    reporter: msg.author.id
                }
            });

            // Add this report into the member's report records
            await user.settings.update(`${msg.guild.id}.reports`, `${msg.author.id}`, {action: 'add'});

            if (reports.length < reportMembers)
                return msg.sendMessage(`:white_check_mark: Thank you for your report. I have not deemed a mute necessary yet. Please provide information and evidence to their misconduct in this channel. Not doing so could be deemed !report abuse, and you could lose reporting privileges.`);

            new GuildMute(user, msg.guild, this.client.user)
                    .setReason(`${reportMembers} have reported you for misconduct within the last ${reportTime} minutes. This does **not** guarantee you are in trouble; staff will investigate and determine. Please be patient.`)
                    .execute();

            return msg.sendMessage(`:mute: Thank you for your report. I have deemed it necessary to mute the user until staff investigate. Please provide information and evidence in this channel of their misconduct. Not doing so could deem this !report as abuse, and you could lose reporting privileges.`);
    }

    }

};



