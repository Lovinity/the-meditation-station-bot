const { Command } = require('klasa');
const moment = require("moment");
const config = require("../../config");
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: [ 'text' ],
            description: 'View your profile or the profile of another user.',
            usage: '[user:user]',
            usageDelim: ' | ',
            cooldown: 15,
            requiredSettings: [ "botChannel" ],
        });
    }

    async run (message, [ user = null ]) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }
        
        if (user === null)
            user = message.author;
        return message.send(`:link: ${message.client.options.dashboardHooks.origin}/profile.html?user=${user.id}`);
    }

};