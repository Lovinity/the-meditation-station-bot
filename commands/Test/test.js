const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [],
            permissionLevel: 10,
            usage: '<person:username>'
        });
    }

    async run(message, [person]) {
        //var stuff = await message.author.settings.reset(`${message.guild.id}.xp`);
        return message.send(person.id);
    }

};


