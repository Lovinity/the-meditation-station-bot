/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'See how much XP you have, and what level you are on.',
            usage: '',
            usageDelim: '',
            cooldown: 60,
            runIn: ['text'],
            requiredSettings: ["botChannel"],
        });
    }

    async run(message, [role]) {
        if (message.channel.id !== message.guild.settings.get('botChannel'))
            return message.send(`:x: Sorry, but this command may only be used in the bot channel.`);

        // Make some calculations
        var xp = message.member.settings.xp;
        var level = Math.floor(0.177 * Math.sqrt(xp)) + 1;
        var upper = Math.ceil((level / 0.177) ** 2);
        var lower = Math.ceil(((level - 1) / 0.177) ** 2);
        var fillValue = Math.min(Math.max((xp - lower) / (upper - lower), 0), 1);
        
        var response = `:crossed_swords: You have **${xp}** XP!
You are currently at level **${level}**.
You need to reach **${upper}** XP to get to the next level.
Progress: `;
        
        var dots = 20;
        while (fillValue > 0)
        {
            fillValue -= 0.05;
            dots--;
            response += `:green_heart: `;
        }
        while (dots > 0)
        {
            dots--;
            response += `:heart: `;
        }
        
        return message.send(response);
    }

};


