const { Command } = require("klasa");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 8,
            aliases: [ "np", "currentlyplaying" ],
            description: "Get information on what is currently playing.",
            extendedHelp: "No extended help available."
        });
    }

    async run (msg) {
        const { music } = msg.guild;
        if (!music.playing) return msg.sendMessage(":x: No music is playing.");

        const [ song ] = music.queue;
        if (!song) return msg.sendMessage(":x: No songs are in the queue.");

        return msg.sendEmbed(new MessageEmbed()
            .setColor("#5bc0de")
            .setTitle("â¯ | Now Playing")
            .setTimestamp()
            .setDescription(`
â€¢ **Title:** ${song.title}
â€¢ **Author:** ${song.author}
â€¢ **Duration:** ${song.friendlyDuration}
â€¢ **Requested By:** ${song.requester}
â€¢ **Link:** ${song.url}`));
    }

};
