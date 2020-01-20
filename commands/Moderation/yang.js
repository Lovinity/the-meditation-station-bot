const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permissionLevel: 4,
            runIn: [ 'text' ],
            description: 'Add or remove Yang from a member (use !discipline if removing yang out of discipline).',
            usage: '<yangAmount:int> <user:username> <reason:string>',
            usageDelim: ' | ',
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async run (message, [ yangAmount, user, reason ]) {
        const eventLogChannel = message.guild.channels.resolve(message.guild.settings.eventLogChannel);
        var settings = await user.guildSettings(message.guild.id)

        await settings.update('yang', settings.yang + yangAmount);

        if (eventLogChannel) {
            eventLogChannel.send(`:gem: ${Math.abs(yangAmount)} Yang was ${yangAmount < 0 ? `charged from` : `awarded to`} ${user.tag} (${user.id}) by ${message.author.tag} (${message.author.id}) for reason: ${reason}`);
        }

        return message.send(`:white_check_mark: ${Math.abs(yangAmount)} Yang has been successfully ${yangAmount < 0 ? `charged from` : `awarded to`} <@${user.id}> for reason: ${reason}.`);
    }

};