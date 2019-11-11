const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'addselfrolegroup',
            permLevel: 4,
            runIn: [ 'text' ],
            description: 'Add a new Self-Role Group',
            usage: '<description:string>',
            usageDelim: ''
        });
    }

    async run (message, [ description ]) {
        var _selfRolesChannel = message.guild.settings.get('selfRolesChannel');
        var selfRolesChannel = this.client.channels.resolve(_selfRolesChannel);
        if (selfRolesChannel) {
            var newMessage = await selfRolesChannel.send(`**__${description} ROLES__**`)
            newMessage.edit(`**__${description} ROLES__** (ID: ${newMessage.id})`)
            var selfRole = this.client.gateways.selfrolegroups.get(`${selfRolesChannel.channel.id}-${newMessage.id}`, true);
            selfRole.update('groupDescription', description)
            return message.send(`:white_check_mark: Self roles group added. You can now add assignable self roles to this group with the !addselfrole command using the message ID ${newMessage.id}`)
        } else {
            return message.send(':x: You need to set the guild selfRolesChannel setting first.')
        }
    }

};