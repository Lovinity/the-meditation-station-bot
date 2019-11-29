const {Monitor} = require('klasa');

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

    run(message) {
        if (message.type !== 'DEFAULT')
            return null;

        // Delete messages without an attachment in channels ending in -pics
        if (message.channel.name.endsWith("-pics") && message.attachments.size <= 0)
        {
            message.send(`:x: This channel is for attachments only. Please use another channel for discussion.`)
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



