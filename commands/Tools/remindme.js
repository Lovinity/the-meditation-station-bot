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
            usage: '<when:time> <text:str> [...]',
            usageDelim: ' | ',
            cooldown: 30,
            requiredSettings: [ "botChannel" ],
        });
    }

    async run (message, [ when, ...text ]) {
        if (message.channel.id !== message.guild.settings.botChannel)
            return message.send(`:x: No spammy whammy! Please use this command in the bot channel.`)

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


