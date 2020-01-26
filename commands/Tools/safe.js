const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: [ 'text' ],
            description: 'Reserved',
            usage: '<set|safeword:string> [setsafeword:string]',
            usageDelim: ' | ',
            cooldown: 15,
            promptLimit: 1,
            promptTime: 60000,
            requiredSettings: [ "unsafeRole" ],
        });
    }

    async run (message, [ first, second = null ]) {
        if (message.member.unsafe && first === 'set') {
            await message.send(`:x: Cannot set right now.`)
            return message.delete();
        }

        if (!message.member.unsafe && first !== 'set') {
            await message.send(`:x: You do not need to do that.`)
            return message.delete();
        }

        if (first === 'set' && second === null) {
            await message.send(`:x: You need to specify a safe word.`)
            return message.delete();
        }

        if (first === 'set') {
            await message.member.settings.update('safeWord', second);
            await message.send(`:white_check_mark: Set!`)
        } else {
            if (message.member.settings.safeWord === null) {
                await message.send(`:x: Please contact a staff member.`);
                return message.delete();
            }
            var unsafeRole = message.guild.roles.get(message.guild.settings.unsafeRole);
            if (unsafeRole) {
                if (first === message.member.settings.safeWord) {
                    await message.member.roles.remove(unsafeRole, `Member is now safe`);
                } else {
                    await message.send(`:x:`);
                }
            }
        }

        return message.delete();
    }

};