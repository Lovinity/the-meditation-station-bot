/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const { Command } = require('klasa');
const yangStore = require('../../util/yangStore');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'creates a reminder',
            usage: '<when:chronotime> <text:str> [...]',
            usageDelim: ' | ',
            cooldown: 30,
            requiredSettings: [ "botChannel" ],
            runIn: [ 'text' ],
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async run (message, [ when, ...text ]) {
        if (message.guild.settings.botChannel && message.channel.id !== message.guild.settings.botChannel) {
            var msg = await message.send(`:x: No spammy whammy! Please use that command in the bot channel.`);
            message.delete();
            setTimeout(() => {
                msg.delete();
            }, 10000);
            return msg;
        }

        if (await yangStore(message, 'remindme', 1)) {
            const reminder = await this.client.schedule.create('reminder', when, {
                data: {
                    channel: message.channel.id,
                    user: message.author.id,
                    text: text.join(' | ')
                }
            });
            return message.send(`:white_check_mark: Got it! I will remind you. Remember this reminder ID: \`${reminder.id}\``);
        }
    }

};


