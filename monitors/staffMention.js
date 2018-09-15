const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'staffMention',
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
        // Someone mentions the mod role, have the bot respond to it regarding the staff command
        if (message.content.includes(`<@&${message.guild.settings.modRole || 0}>`))
        {
            message.channel.send(`<@${message.author.id}>, instead of mentioning staff, please use the bot command \`!staff\` to create a private channel between you and staff.`);
        }
    }

    async init() {
    }

};
