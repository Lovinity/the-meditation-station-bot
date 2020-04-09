const {Command} = require('klasa');
var wait = require('wait-for-stuff');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permissionLevel: 5,
            botPerms: ['MANAGE_ROLES'],
            runIn: ['text'],
            description: 'Add or remove a level role.',
            usage: '<level:int{2,100}> [role:rolename]',
            usageDelim: ' | ',
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async run(message, [level, role = null]) {
        if (role === null)
        {
            // Remove the role from everyone who has it
            var temp = message.guild.settings.levelRoles[`level${level}`];
            if (temp && temp !== null)
            {
                message.guild.members.each(guildMember => {
                    if (guildMember.roles.has(temp))
                        guildMember.roles.remove(temp, `Level was deleted`);
                });
            }

            await message.guild.settings.reset(`levelRoles.level${level}`);
        } else {
            // In the case of overwriting level roles, make sure to remove the old one from members
            var temp = message.guild.settings.levelRoles[`level${level}`];
            if (temp && temp !== null)
            {
                message.guild.members.each(guildMember => {
                    if (guildMember.roles.has(temp))
                        guildMember.roles.remove(temp, `Level was deleted`);
                });
            }
            await message.guild.settings.update(`levelRoles.level${level}`, role, message.guild, {action: 'add'});
        }

        // Update level roles
        var levelRoles = {}
        var levelRoles2 = message.guild.settings.levelRoles;
        for (var key in levelRoles2)
        {
            if (levelRoles2.hasOwnProperty(key))
            {
                if (levelRoles2[key] === null)
                    continue;
                levelRoles[key.replace('level', '')] = levelRoles2[key];
            }
        }
        var levelKeys = Object.keys(levelRoles);
        if (levelKeys.length > 0)
        {
            message.guild.members.each(guildMember => {
                var rolesToAdd = [];
                var rolesToRemove = [];
                levelKeys.map(levelKey => {
                    var xp = Math.ceil(((levelKey - 1) / 0.177) ** 2);
                    if (guildMember.guild.roles.has(levelRoles[levelKey]))
                    {
                        if (guildMember.settings.xp >= xp && !guildMember.roles.has(levelRoles[levelKey]))
                        {
                            rolesToAdd.push(levelRoles[levelKey]);
                        } else if (guildMember.settings.xp < xp && guildMember.roles.has(levelRoles[levelKey])) {
                            rolesToRemove.push(levelRoles[levelKey]);
                        }
                    }
                });

                if (rolesToAdd.length > 0)
                    guildMember.roles.add(rolesToAdd, `Level Update (Add roles)`)
                            .then(stuff => {
                                if (rolesToRemove.length > 0)
                                    guildMember.roles.remove(rolesToRemove, `Level Update (Remove roles)`);
                            });
            });
        }

        return message.send(`:white_check_mark: Levels have been updated.`);
    }

};


