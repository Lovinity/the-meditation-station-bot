const {Command} = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 10,
            aliases: ["shufflequeue", "queueshuffle"],
            requiredPermissions: ["USE_EXTERNAL_EMOJIS"],
            description: "Randomize the current queue.",
            extendedHelp: "No extended help available."
        });

        this.requireDJ = true;
        this.requireMusic = true;
    }

    async run(msg) {
        const { music } = msg.guild;
        if (!music.playing) return msg.sendMessage(':x: No music is playing.');
        if (music.queue.length <= 2) return msg.sendMessage(`:x: Your queue has less than two songs, add more to shuffle!`);

        this.shuffleArray(music.queue);
        return msg.sendMessage(`***Queue has now been shuffled!***`);
    }

    shuffleArray(array) {
        const [first] = array;
        array.shift();
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        array.unshift(first);
    }

};
