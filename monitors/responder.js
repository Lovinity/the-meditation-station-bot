const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'responder',
            enabled: true,
            ignoreBots: false,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: false,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
        this.manager = new NlpManager({languages: ['en']});
    }

    run(message) {
        if (/(https?:\/\/[^\s]+)/g.test(message.content) && message.member.settings.xp < 128)
        {
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

    async init() {
    }

};



