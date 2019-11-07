const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'sudo',
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
        if (message.content.includes(`!sudo rm -rf /`))
        {
            message.send(`:warning: __**WARNING! DELETING ALL DATA ON THE BOT SERVER...**__ :warning:`)
                    .then(msg => {
                        setTimeout(() => {
                            msg.edit(`https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
                        }, 10000);
                    });
        }
    }

    async init() {
    }

};

