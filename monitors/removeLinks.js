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
            ignoreBlacklistedGuilds: true
        });
    }

    run (message) {
        if (message.type !== 'DEFAULT')
            return null;
        const { permission } = await this.client.permissionLevels.run(message, 4);
        if (/(https?:\/\/[^\s]+)/g.test(message.content) && message.member.settings.xp < 128 && !permission) {
            message.channel.send(`:x: <@${message.author.id}>, You must be level 3 (128 XP) or above to post links in this guild.`)
                .then((msg) => {
                    setTimeout(function () {
                        msg.delete();
                    }, 10000);
                });
            message.delete();
            return null;
        }
    }

    async init () {
    }

};



