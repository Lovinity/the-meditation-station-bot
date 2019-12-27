const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'active',
            enabled: true,
            ignoreBots: false,
            ignoreSelf: false,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: true,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
    }

    async run(message) {
        if (message.type !== 'DEFAULT' || !message.member)
            return null;

        var inactiveRole = message.guild.roles.resolve(message.guild.settings.inactiveRole);
        if (inactiveRole && message.member.roles.get(inactiveRole.id)) {
            message.member.roles.remove(inactiveRole, `Member no longer inactive`);
        }
    }

    async init() {
    }

};