const { Command, MessageEmbed } = require("klasa");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            aliases: ["savesong", "dmcurrentsong"],
            description: `Receive a DM containing information about the currently playing song.`,
            extendedHelp: "No extended help available."
        });
    }

    async run(msg) {
        const { music } = msg.guild;
        if (!music.playing) return msg.send(`:x: I am not currently playing music.`);

        const [song] = music.queue;
        if (!song) return msg.sendMessage(`:x: There are no songs in the queue.`);

        const embed = new MessageEmbed()
            .setColor("#5bc0de")
            .setTitle("â¯ | Now Playing")
            .setTimestamp()
            .setDescription(`
â€¢ **Title:** ${song.title}
â€¢ **Author:** ${song.author}
â€¢ **Duration:** ${song.friendlyDuration}
â€¢ **Requested By:** ${song.requester}
â€¢ **Link:** ${song.url}`);

        return msg.author.sendEmbed(embed).catch(() => { throw `:x: You are not allowing me to send you DMs.`; });
    }

};
