const {Command} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            aliases: [],
            permissionLevel: 10,
            usage: '<role:rolename>'
        });
    }

    async run(message, [role]) {
        //var stuff = await message.author.settings.reset(`${message.guild.id}.xp`);
        return message.send(role.id);
    }

};


