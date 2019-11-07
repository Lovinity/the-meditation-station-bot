const { Command } = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            aliases: ["resume"],
            permissionLevel: 2,
            requiredPermissions: ["USE_EXTERNAL_EMOJIS"],
            description: language => language.get("COMMAND_PAUSE_DESCRIPTION"),
            extendedHelp: "No extended help available."
        });

        this.requireDJ = true;
        this.requireMusic = true;
    }

    async run(msg) {
        const { music } = msg.guild;
        if (!music.playing) return msg.sendMessage(":x: No music is playing");

        await music.pause();

        return msg.sendMessage(`â¯ | ***The music has been ${music.paused ? "paused" : "resumed"}!***`);
    }

};
