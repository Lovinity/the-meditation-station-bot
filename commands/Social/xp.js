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
        if (message.channel.id !== message.guild.settings.botChannel)
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
            var xp2 = user.guildSettings(message.guild.id).xp;
            var level2 = Math.floor(0.177 * Math.sqrt(xp2)) + 1;
            var upper2 = Math.ceil((level / 0.177) ** 2);
            var lower2 = Math.ceil(((level - 1) / 0.177) ** 2);
            var fillValue2 = Math.min(Math.max((xp2 - lower2) / (upper2 - lower2), 0), 1);

            var claimed = (xp / (xp + xp2));

            var response = `:crossed_swords: XP Battle! (:sun_with_face: You / ${user.tag} :full_moon_with_face:)
**XP**     :sun_with_face: ${xp} / ${xp2} :full_moon_with_face:
**Level**  :sun_with_face: ${level} / ${level2} :full_moon_with_face: 
**Battle** `;

            var dots = 20;
            while (claimed > 0)
            {
                claimed -= 0.05;
                dots--;
                response += `:sun_with_face: `;
            }
            while (dots > 0)
            {
                dots--;
                response += `:full_moon_with_face: `;
            }
        }

        return message.send(response);
    }

};


