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

    async run (message) {
        // Delete discord invites
        const { permission } = await this.client.permissionLevels.run(message, 4);
        if (/(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(message.content) && !permission) {

            // Delay deletion by 3 seconds so it doesn't conflict with the !ad command.
            setTimeout(() => {
                message.send(`:x: <@${message.author.id}>, please use the !ad command if you want to purchase an ad to promote a server. Ignore this if you are using the !ad command.`)
                    .then((msg) => {
                        setTimeout(function () {
                            msg.delete();
                        }, 15000);
                    });
                message.delete();
            }, 3000);
        }
    }

    async init () {
    }

};

