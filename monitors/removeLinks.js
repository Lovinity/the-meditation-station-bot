const { Monitor } = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            enabled: false,
            ignoreBots: false,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: false,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
    }

    async run (message) {
        if (message.type !== 'DEFAULT')
            return null;
        const { permission } = await this.client.permissionLevels.run(message, 4);
        if (/(https?:\/\/[^\s]+)/g.test(message.content) && message.member.settings.xp < 128 && !permission) {
            // Delay deletion by 3 seconds so it doesn't conflict with the !ad command.
            setTimeout(() => {
                message.send(`:x: <@${message.author.id}>, You must be level 3 (128 XP) or above to post links in this guild. Ignore if you are creating an !ad.`)
                    .then((msg) => {
                        setTimeout(function () {
                            msg.delete();
                        }, 15000);
                    });
                message.delete();
            }, 3000);
            return null;
        }
    }

    async init () {
    }

};



