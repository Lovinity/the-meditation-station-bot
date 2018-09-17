/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'See your reputation, or if a name is provided, the reputation of someone else.',
            usage: '[user:username]',
            usageDelim: '',
            cooldown: 60,
            runIn: ['text'],
            requiredSettings: ["botChannel"],
        });
    }

    async run(message, [user = null]) {
        if (message.channel.id !== message.guild.settings.get('botChannel'))
            return message.send(`:x: Sorry, but this command may only be used in the bot channel.`);

// Make some calculations
        var totalrep = message.member.settings.goodRep - message.member.settings.badRep;
        var fillValue = message.member.settings.goodRep / totalrep;
        if (user === null)
            user = message.author;

        var response = `**Reputation for ${user.tag}**
:heavy_plus_sign: ${message.member.settings.goodRep} / :heavy_minus_sign: ${message.member.settings.badRep}
Total reputation: **${totalrep}**
Visualization: `;

        var dots = 20;
        while (fillValue > 0)
        {
            fillValue -= 0.05;
            dots--;
            response += `:heavy_plus_sign: `;
        }
        while (dots > 0)
        {
            dots--;
            response += `:heavy_minus_sign: `;
        }

        return message.send(response);
    }

};



