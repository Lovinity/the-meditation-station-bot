/*
 To use this correctly, you will also need the reminder task located in
 /tasks/reminder.js
 */
const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'If user provided, see how much XP you have compared to the user. If not provided, see your own XP.',
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
        var xp = message.member.settings.xp;
        var level = Math.floor(0.177 * Math.sqrt(xp)) + 1;
        var upper = Math.ceil((level / 0.177) ** 2);
        var lower = Math.ceil(((level - 1) / 0.177) ** 2);
        var fillValue = Math.min(Math.max((xp - lower) / (upper - lower), 0), 1);
        if (user === null)
        {

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
        } else {
// Make some calculations
            var xp2 = user.settings[message.guild.id].xp;
            var level2 = Math.floor(0.177 * Math.sqrt(xp)) + 1;
            var upper2 = Math.ceil((level / 0.177) ** 2);
            var lower2 = Math.ceil(((level - 1) / 0.177) ** 2);
            var fillValue2 = Math.min(Math.max((xp - lower) / (upper - lower), 0), 1);

            var claimed = (xp / (xp + xp2));

            var response = `:crossed_swords: XP Battle! (:smirk: You / ${user.tag} :smirk_cat:)
**XP**     :smirk: ${xp} / ${xp2} :smirk_cat: 
**Level**  :smirk: ${level} / ${level2} :smirk_cat: 
**Battle** `;

            var dots = 20;
            while (claimed > 0)
            {
                claimed -= 0.05;
                dots--;
                response += `:smirk: `;
            }
            while (dots > 0)
            {
                dots--;
                response += `:smirk_cat: `;
            }
        }

        return message.send(response);
    }

};


