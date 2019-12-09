const { Command, util, RichMenu } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'modlogs',
            permissionLevel: 4,
            runIn: [ 'text' ],
            description: 'Generate a link to view moderation logs for the specified user.',
            usage: '<user:username>',
            usageDelim: ' | ',
        });
    }

    async run (message, [ user ]) {
        return message.send(`:link: ${message.client.options.dashboardHooks.origin}/modlogs.html?user=${user.id}`);
    }
}