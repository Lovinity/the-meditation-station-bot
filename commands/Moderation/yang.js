const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permissionLevel: 4,
            runIn: [ 'text' ],
            description: 'Add or remove Yang from a member (use !discipline if removing yang out of discipline).',
            usage: '<yang:int> <user:username> <reason:string>',
            usageDelim: ' | '
        });
    }

    async run (message, [ yang, user, reason ]) {
        const eventLogChannel = message.guild.channels.resolve(message.guild.settings.eventLogChannel);

        await user.guildSettings(message.guild.id).update('yang', user.guildSettings(message.guild.id).yang + yang);

        if (eventLogChannel) {
            eventLogChannel.send(`:gem: ${Math.abs(yang)} Yang was ${yang < 0 ? `charged from` : `awarded to`} ${user.tag} (${user.id}) by ${message.author.tag} (${message.author.id}) for reason: ${reason}`);
        }

        return message.send(`:white_check_mark: ${Math.abs(yang)} Yang has been successfully ${yang < 0 ? `charged from` : `awarded to`} <@${user.id}> for reason: ${reason}.`);
    }

};