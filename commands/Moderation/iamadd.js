const {Command} = require('klasa');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permLevel: 4,
            botPerms: ['MANAGE_ROLES'],
            runIn: ['text'],
            description: 'Create a new self-assignable role',
            usage: '<name:str>',
            usageDelim: ' | '
        });
    }

    async run(message, [name]) {
        var message = await message.send(`:hourglass_flowing_sand: Adding new role...`);

        var newRole = await message.guild.roles.create({
            data: {
                name: name,
                hoist: false,
                permissions: 0,
                mentionable: false
            },
            reason: `Self assign role`
        });

        if (newRole)
        {
            await message.guild.settings.update(`selfRoles`, newRole, message.guild);
            return message.send(`:white_check_mark: New self-assign role complete!`);
        } else {
            return message.send(`:x: There was a problem creating the self-assign role.`);
        }
    }

};


