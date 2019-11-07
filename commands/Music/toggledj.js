const { Command } = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            permissionLevel: 5,
            cooldown: 8,
            aliases: ["djonly"],
            requiredPermissions: ["USE_EXTERNAL_EMOJIS"],
            description: "Enable or disable DJ mode for music.",
            extendedHelp: "No extended help available."
        });
    }

    async run(msg) {
        const toggle = !msg.guild.settings.music.djMode;
        await msg.guild.settings.update("music.djMode", toggle);
        return msg.sendMessage(`${toggle ? this.client.emotes.check : this.client.emotes.cross} ***DJ only mode has been ${toggle ? "Enabled" : "Disabled"}***`);
    }

};
