const { Monitor } = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'selfBot',
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

    run (message) {
        // Self bot detection: regular members cannot add embeds immediately on message creation. Safe to assume this is hard evidence of a self bot. We can pursue action immediately.
        if (message.embeds.length > 0) {
            var discipline = new GuildDiscipline(message.author, message.guild, message.client.user)
                .setType('classG')
                .setReason(`Self-Bot Detection: An embed was detected on a message you sent (ID: ${message.id}). Regular members cannot create embeds on their own without using a bot or script (which is against Discord's Terms). Staff will investigate and may report this incident to Discord.`)
                .addRule(message.guild.settings.selfBotsRuleNumber);
            discipline.prepare()
                .then(prepared => {
                    prepared.finalize();
                });
        }
    }

    async init () {
    }

};
