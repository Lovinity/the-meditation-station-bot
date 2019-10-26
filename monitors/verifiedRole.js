const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'verifiedRole',
            enabled: true,
            ignoreBots: true,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: true,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
    }

    run(message) {
        if (message.type !== 'DEFAULT')
            return null;
        const verified = message.guild.settings.verifiedRole;
        const verifiedRole = message.guild.roles.resolve(verified);
        if (verifiedRole)
        {
            if (!message.member.roles.get(verifiedRole.id))
                message.member.roles.add(verifiedRole, `Member is verified`);
        }
    }

    async init() {
    }

};

