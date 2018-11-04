/*
 * This command is used to report a conflict in a text channel. If a configured number of members report in a configured amount of time, the bot
 * activates conflict resolution, taking "SEND_MESSAGES" away from everyone for 5 minutes while instructing a breathing exercise, and then
 * proceeding with conflict resolution questions. Used with tasks/conflictstage[2-5].js and tasks/removeconflict.js.
 */
const {Command} = require('klasa');
const moment = require('moment');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Issue this command inside a text channel when there is a conflict going on in that channel.',
            usage: '',
            usageDelim: '',
            cooldown: 30,
            runIn: ['text'],
            requiredPermissions: ["MANAGE_ROLES"],
            requiredSettings: ["conflictResolution", "conflictResolutionMembers", "conflictResolutionTime"],
            extendedHelp: 'When multiple people use this command in the same text channel in a certain period of time, I will intervene by muting the channel for 5 minutes and posting a breathing exercise for everyone to try. Then, I will unmute the channel and ask 3 sets of conflict resolving questions, giving 5 minutes in between each set for members to respond.'
        });
    }

    async run(message, []) {
        // First, get configured settings
        const conflict = message.channel.settings.conflictResolution;
        const confMembers = message.guild.settings.conflictResolutionMembers || 3;
        const confTime = moment().add(parseInt(message.guild.settings.conflictResolutionTime), 'minutes').toDate();
        const {permission} = await this.client.permissionLevels.run(message, 4);

        // Is there an active conflict resolution on this channel? If so, forfeit.
        if (conflict.indexOf(`ACTIVE`) !== -1)
            return message.send(`:x: I'm sorry to hear the conflict is still going on. But I cannot start another conflict resolution when one is in progress. If there are still issues, consider stepping away for a while, or reporting the problematic members via the instructions from the report-a-member channel.`);

        // Check if this specific member used the conflict command in this specific channel recently. If not, add an entry
        if (conflict.indexOf(`${message.channel.id}-${message.author.id}`) === -1)
        {
            // Add a scheduled task to remove this report after configured minutes.
            const conflictadd = await this.client.schedule.create('removeconflict', confTime, {
                data: {
                    channel: message.channel.id,
                    user: message.author.id
                }
            });

            // Add this report into settings, both to count the number of reports, and to prevent multiple reports by the same member.
            await message.channel.settings.update('conflictResolution', `${message.channel.id}-${message.author.id}`, {action: 'add'});

            // Not anough members reported yet to trigger conflict resolution? And member is not staff (level 4 permission)? Inform the channel.
            if (conflict.length < confMembers && !permission)
            {
                return message.sendMessage(`:white_check_mark: ${confMembers - (conflict.length)} more members need to issue the command in this channel in the next ${message.guild.settings.conflictResolutionTime} minutes for conflict resolution to activate.`);

                // Time to activate!
            } else {
                // Add an "ACTIVE" entry to prevent further use of this command until conflict resolution finishes.
                await message.channel.settings.update('conflictResolution', `ACTIVE`, {action: 'add'});

                // rename the channel to include "-MUTED" at the end of the title, which tells messageCreate to remove all messages posted
                await message.channel.setName(`${message.channel.name}-muted`, 'Channel mute due to !conflict');

                // Add a 5 minute task. In 5 minutes, send messages will be re-granted, and the bot will begin asking conflict resolving questions.
                const conflictstage2 = await this.client.schedule.create('conflictstage2', moment().add(5, 'minutes').toDate(), {
                    data: {
                        channel: message.channel.id
                    }
                });
                
                // Add 20 to the raid score of the guild
                message.guild.raidScore(20);

                // Send a message
                return message.sendMessage(`:warning: **__Everyone, please take the next 5 minutes to calm down with this breathing exercise__** :warning:
                
Take a deep, slow inhale through your nose for 4 counts. Hold for a count of 4. Then slowly exhale through your mouth for a count of 6. Repeat for the next 5 minutes, counting on each exhale.
Use this gif to help you with the breathing exercise: https://giphy.com/gifs/breathing-8YfwmT1T8PsfC .
                
In 5 minutes, I will re-enable message sending and provide some questions to aid in resolving this conflict. Continuing this conversation elsewhere before the 5 minutes may result in staff intervention / discipline.
`);
            }
            // Member already used the command recently in this channel.
        } else {
            return message.sendMessage(`:x: You already issued the conflict command in this channel within the last ${message.guild.settings.conflictResolutionTime} minutes.`);
    }
    }

};


