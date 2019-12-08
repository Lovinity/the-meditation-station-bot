const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permissionLevel: 5,
            botPerms: [ 'MANAGE_CHANNELS' ],
            runIn: [ 'text' ],
            description: 'Clone the text channel and then set the original channel to read-only by administrators.',
            usage: '',
            usageDelim: ''
        });
    }

    async run (message, []) {

        var newChannel = await message.channel.clone({ options: { reason: "Channel archive" } });

        await message.channel.overwritePermissions({
            permissionOverwrites: [
                {
                    id: message.channel.guild.roles.everyone,
                    deny: [ 'VIEW_CHANNEL' ],
                },
            ],
            reason: 'Channel archive'
        });

        await message.channel.edit({name: `${message.channel.name}-archived`});

        await newChannel.send(`:exclamation: This is a cloned channel; the original channel by the same name has been archived by staff and can no longer be accessed by regular members.`);

        return message.send(':white_check_mark: This channel has been archived.' + "\n" + ':warning: If this channel was a part of bot configuration, be sure to update it with the new channel!')
    }

};