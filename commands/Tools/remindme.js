/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'creates a reminder',
            usage: '<when:time> <text:str> [...]',
            usageDelim: ' | ',
            cooldown: 30,
            requiredSettings: ["botChannel"],
        });
    }

    async run(message, [when, ...text]) {
        if (message.channel.id !== message.guild.settings.botChannel)
            return message.sendMessage(`:x: Sorry, but this command may only be used in the bot channel.`)
        const reminder = await this.client.schedule.create('reminder', when, {
            data: {
                channel: message.channel.id,
                user: message.author.id,
                text: text.join(' | ')
            }
        });
        return message.sendMessage(`:white_check_mark: Got it! I will remind you. Remember this reminder ID: \`${reminder.id}\``);
    }

};


