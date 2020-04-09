const { Monitor } = require('klasa');
const moment = require("moment");

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'active',
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

    async run (message) {
        if (message.type !== 'DEFAULT' || !message.member)
            return null;

        var inactiveRole = message.guild.roles.resolve(message.guild.settings.inactiveRole);
        if (inactiveRole && message.member.roles.cache.get(inactiveRole.id)) {
            message.member.roles.remove(inactiveRole, `Member no longer inactive`);

            // Post about being active again if applicable
            message.guild.channels
                .filter((channel) => channel.topic && channel.topic !== null && channel.topic.startsWith(`Inactive member ${message.author.id}`))
                .each((channel) => {
                    channel.send(`:white_check_mark: There you are! Thank you for posting a message. You are no longer considered inactive.`)
                });
        }

        message.member.settings.update('lastMessage', moment().toISOString(true));
    }

    async init () {
    }

};