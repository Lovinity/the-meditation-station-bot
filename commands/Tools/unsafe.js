const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            runIn: [ 'text' ],
            description: 'Reserved',
            usage: '',
            usageDelim: '',
            cooldown: 15,
            requiredSettings: [ "unsafeRole" ],
        });
    }

    async run (message, []) {
        var unsafeRole = message.guild.roles.resolve(message.guild.settings.unsafeRole);
        if (unsafeRole && !message.member.muted)
            message.member.roles.add(unsafeRole, `Member indicated they are unsafe`);

        return message.delete();
    }

};