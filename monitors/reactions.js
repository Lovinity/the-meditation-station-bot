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

        // Moonbutts!
        if (message.content.toLowerCase().includes("moonbutt"))
        {
            // Wait, so the rep clearer doesn't remove it.
            setTimeout(function () {
                message.react("503051550785011722");
            }, 5000);
        }

        // Dickle cucumber
        if (message.content.toLowerCase().includes("dickle"))
        {
            // Wait, so the rep clearer doesn't remove it.
            setTimeout(function () {
                message.react("🥒");
            }, 5000);
        }

        // mods
        if (message.content.toLowerCase().includes("the mods") || message.content.toLowerCase().includes("the moderators"))
        {
            // Wait, so the rep clearer doesn't remove it.
            setTimeout(function () {
                message.react("👀");
            }, 5000);
        }

        //creep
        if (message.content.toLowerCase().includes("creep"))
        {
            // Wait, so the rep clearer doesn't remove it.
            setTimeout(function () {
                message.react("😳");
            }, 5000);
        }

        //troll
        if (message.content.toLowerCase().includes("troll"))
        {
            // Wait, so the rep clearer doesn't remove it.
            setTimeout(function () {
                message.react("😈");
            }, 5000);
        }
        
        //bug
        if (message.content.toLowerCase().includes("bug"))
        {
            // Wait, so the rep clearer doesn't remove it.
            setTimeout(function () {
                message.react("🐞");
            }, 5000);
        }

    }

    async init() {
    }

};


