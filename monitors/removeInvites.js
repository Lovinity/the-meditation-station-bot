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
        const { permission } = await this.client.permissionLevels.run(message, 4);
        if (/(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(message.content) && !permission)
        {
            message.channel.send(`:x: <@${message.author.id}>, please contact a staff member if you want to promote a server.`)
            .then((msg) => {
                setTimeout(function () {
                    msg.delete();
                }, 10000);
            });
            message.delete();
        }
    }

    async init() {
    }

};

