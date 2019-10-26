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
            ignoreBlacklistedGuilds: false
        });
    }

    run(message) {
        // Delete discord invites
        if (message.content.includes("@everyone"))
        {
            if (message.guild.settings.modRole && !message.member.roles.get(message.guild.settings.modRole))
            {
                message.channel.send(`:x: <@${message.author.id}>, only staff may use the everyone mention.`);
                message.delete();
            }
        }
    }

    async init() {
    }

};

