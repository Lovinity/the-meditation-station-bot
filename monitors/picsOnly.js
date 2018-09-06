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
        // Delete messages sent in channels that have -MUTED at the end of their name (muted channels)
        if (message.channel.name.endsWith("-pics") && message.attachments.size <= 0)
        {
            message.channel.send(`:x: This channel is for attachments only. Please use another channel for discussion.`)
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



