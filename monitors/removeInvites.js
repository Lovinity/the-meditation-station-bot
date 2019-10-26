const { Monitor } = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            enabled: true,
            ignoreBots: false,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: false,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: false
        });
    }

    run(message) {
        // Delete discord invites
        if (/(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(message.content) && !message.member.roles.get(message.guild.settings.modRole))
        {
            message.channel.send(`:x: <@${message.author.id}>, please contact a staff member if you want to promote a server.`);
            message.delete();
        }
    }

    async init() {
    }

};

