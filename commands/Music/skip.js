const { Command } = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            requiredPermissions: [ "USE_EXTERNAL_EMOJIS" ],
            description: "Skip the currently playing track if there are less than 3 people in the channel, else start a vote to skip it.",
            extendedHelp: "No extended help available."
        });
        this.votes = new Map();
        this.requireMusic = true;
        this.requireDJ = true;
    }

    async run (msg) {
        const { music } = msg.guild;

        if (music.voiceChannel.members.size > 2) {
            if ("force" in msg.flags) {
            } else {
                const response = this.handleSkips(music, msg.author.id);
                if (response) return msg.send(response);
            }
        }

        const [ song ] = music.queue;
        await music.skip(true);

        return msg.sendMessage(`ðŸŽ§ **Skipped Track:** ${song.title}`);
    }

    handleSkips (musicInterface, user) {
        const [ song ] = musicInterface.queue;
        if (song.skips.has(user)) return "You have already voted to skip this song.";
        song.skips.add(user);
        const members = musicInterface.voiceChannel.members.size - 1;
        return this.shouldInhibit(members, song.skips.size);
    }

    shouldInhibit (total, size) {
        if (total <= 3) return true;
        return size >= total * 0.4 ? false : `ðŸ”¸ | Votes: ${size} of ${Math.ceil(total * 0.4)}`;
    }

};
