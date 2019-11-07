const { Command } = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            aliases: ["changevol", "setvolume"],
            requiredPermissions: ["USE_EXTERNAL_EMOJIS"],
            description: language => language.get("COMMAND_VOLUME_DESCRIPTION"),
            extendedHelp: "No extended help available.",
            usage: "[volume:integer]"
        });

        this.requireDJ = true;
        this.requireMusic = true;
    }

    async run(msg, [volume]) {
        if (!volume) return msg.sendMessage(`ðŸ”ˆ | ***Guild's Current Music Volume is:*** ${msg.guild.settings.music.volume}`);
        if (volume <= 0 || volume >= 100) return msg.sendMessage(`${this.client.emotes.cross} ***Volume can not be lower than 0 or higher than 100.***`);

        await msg.guild.music.setVolume(volume);

        return msg.sendMessage(`${this.client.emotes.check} ***Volume has been set to:*** ${volume}`);
    }

};
