const Command = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            aliases: ["stopmusic", "musicstop"],
            requiredPermissions: ["USE_EXTERNAL_EMOJIS"],
            description: "Stops playing music and leaves the voice channel.",
            extendedHelp: "No extended help available."
        });

        this.requireDJ = true;
    }

    async run(msg) {
        const { music } = msg.guild;
        if (!music.queue || !music.queue.length) return msg.sendMessage(`:x: ***There are no songs in the queue at the moment.***`);

        const vc = music.voiceChannel ? music.voiceChannel.members.size <= 4 : true;
        if (await msg.hasAtLeastPermissionLevel(4) || vc) {
            await music.destroy();
            return msg.sendMessage(`${this.client.emotes.check} ***Queue cleared, leaving voice channel.***`);
        } else {
            return msg.sendMessage(`${this.client.emotes.cross} ***There are members in the VC right now, use skip instead!***`);
        }
    }

};
