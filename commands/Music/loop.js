const { Command } = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 10,
            aliases: [ "loopsong", "repeat" ],
            requiredPermissions: [ "USE_EXTERNAL_EMOJIS" ],
            description: 'Toggle song or queue looping.',
            usage: "[queue|song]"
        });

        this.requireMusic = true;
        this.requireDJ = true;
    }

    async run (msg, [ queueOrSong = "song" ]) {
        if (msg.channel.type !== "text") throw ":x: This command may be only executed in a server.";

        const { music } = msg.guild;
        if (!music.playing) return msg.sendMessage(`:x: There is no music playing.`);

        if (queueOrSong === "song") {
            music.looping = !music.looping;
        } else {
            if (music.queue.length * 2 > 1000) return msg.sendMessage(":x: The queue is full.");
            music.queue = music.queue.concat(music.queue);
        }

        return msg.sendMessage(`ðŸŽ§ ${queueOrSong === "song" ? "Song" : "Queue"} looping is now ${queueOrSong === "queue" ? "The whole queue will now repeat." : music.looping ? "enabled" : "disabled"}.`);
    }

};
