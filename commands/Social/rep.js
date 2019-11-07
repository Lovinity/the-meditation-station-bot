/*
 * This command is used to report a conflict in a text channel. If a configured number of members report in a configured amount of time, the bot
 * activates conflict resolution, taking "SEND_MESSAGES" away from everyone for 5 minutes while instructing a breathing exercise, and then
 * proceeding with conflict resolution questions. Used with tasks/conflictstage[2-5].js and tasks/removeconflict.js.
 */
const { Command } = require('klasa');
const moment = require('moment');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Award 10 good reputation to a member of your choosing for Yang.',
            usage: '<user:username> <reason:str>',
            usageDelim: ' | ',
            cooldown: 30,
            runIn: [ 'text' ],
            requiredSettings: [ "noRepRole", "botChannel" ],
            extendedHelp: 'You can use this command once every 24 hours to award 10 good reputation to a member in the guild. Format: rep guildMember | reason for repping. Abuse of the rep command could be disciplined.'
        });
    }

    async run (message, [ user, reason ]) {
        if (message.channel.id !== message.guild.settings.botChannel)
            return message.send(`:x: No spammy whammy! Please use this command in the bot channel.`);

        // Disallow repping if user has the no rep role
        const noRep = message.guild.settings.noRep
        const noRepRole = message.guild.roles.resolve(noRep)
        if (noRepRole && message.member.roles.get(noRepRole.id))
            return message.send(`:x: Sorry, but you have the No Rep role, therefore you cannot give good reputation to others.`);

        // Disallow repping if canRep is false
        if (!message.member.settings.canRep)
            return message.send(`:x: Sorry, you can only rep someone once every 24 hours.`);

        // Purchase repping
        if (await yangStore(message, 'repMember', 1)) {
            user.guildSettings(message.guild.id).update(`goodRep`, user.guildSettings(message.guild.id).goodRep + 10)
            const channel2 = message.guild.channels.resolve(message.guild.settings.eventLogChannel);
            if (channel2) {
                channel2.send(`:rep: User ${message.author.tag} (${message.author.id}) repped ${user.tag} (${user.id}) for the following reason: ${reason}`);
            }
            message.author.guildSettings(message.guild.id).update(`canRep`, false)
            const timer = await this.client.schedule.create('repAgain', moment().add(24, 'hours').toDate(), {
                data: {
                    guild: message.guild.id,
                    user: user.id
                }
            });
            return message.send(`:white_check_mark: You have repped that user. Thank you for sharing the love!`);
        }
    }

};
