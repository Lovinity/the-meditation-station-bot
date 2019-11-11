const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'addselfrole',
            permLevel: 4,
            runIn: [ 'text' ],
            description: 'Add a self-role in a self-role group',
            usage: '<rolereaction:rolereaction> <messageID:string>',
            usageDelim: ' | '
        });
    }

    async run (message, [ rolereaction, messageID ]) {
        var _selfRolesChannel = message.guild.settings.get('selfRolesChannel');
        var selfRolesChannel = this.client.channels.resolve(_selfRolesChannel);
        if (selfRolesChannel) {
            var msg = await selfRolesChannel.messages.fetch(messageID)
            if (msg) {
                var selfRole = this.client.gateways.selfrolegroups.get(`${selfRolesChannel.id}-${msg.id}`);
                if (selfRole) {
                    selfRole.update('selfRoles', rolereaction, {action: 'add'});

                    var selfRoles = selfRole.selfRoles;
                    var newMessage = `**__${selfRole.description} ROLES__** (ID: ${msg.id})` + "\n"
                    selfRoles.map((role) => {
                        newMessage += "\n" + `${role.rolereaction.emoji} | ${role.rolereaction.name}`
                    })

                    msg.edit(newMessage);
                    msg.react(rolereaction.emoji);
                    return message.send(`:white_check_mark: The self role has been added to the list of roles.`)
                } else {
                    return message.send(`:x: The provided message ID is not a self roles group.`)
                }
            } else {
                return message.send(':x: The provided message ID does not exist in the selfRolesChannel.')
            }
        } else {
            return message.send(':x: You need to set the guild selfRolesChannel setting first.')
        }
    }

};