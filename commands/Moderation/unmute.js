const { Command } = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permissionLevel: 5,
            botPerms: [ 'MANAGE_ROLES' ],
            runIn: [ 'text' ],
            description: 'Unmute a member.',
            usage: '<user:username>',
            usageDelim: '',
            promptLimit: 1,
            promptTime: 60000
        });
    }

    async run (message, [ user ]) {

        const muted = message.guild.settings.muteRole;
        const mutedRole = message.guild.roles.resolve(muted);
        var guildMember = message.guild.members.resolve(user.id);
        var settings = await user.guildSettings(message.guild.id);

        if (!mutedRole)
            return message.send(`:x: This guild does not have a muteRole. Please create a muteRole to use the unmute command.`);

        if (guildMember) {
            if (!guildMember.roles.get(muted))
                return message.send(`:x: That user is not currently muted.`);

            guildMember.roles.remove(mutedRole, `Mute removed with !unmute by ${message.author.tag}`);
            const channel = message.guild.channels.resolve(message.guild.settings.generalChannel);
            if (channel) {
                channel.send(`:loud_sound: <@${user.id}> , your mute has been removed by staff. You can now participate in the guild again.`);
            }
        } else {
            if (!settings.muted)
                return message.send(`:x: That user is not currently muted.`);
        }

        settings.update(`muted`, false, message.guild);

        const channel2 = message.guild.channels.resolve(message.guild.settings.modLogChannel);
        if (channel2) {
            channel2.send(`:loud_sound: Member ${user.tag} (${user.id}) was unmuted by ${message.author.tag}.`);
        }

        return message.send(`:white_check_mark: User was unmuted!`);
    }

};