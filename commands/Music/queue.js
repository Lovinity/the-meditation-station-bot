const { Command, RichDisplay } = require("klasa");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 10,
            requiredPermissions: ["USE_EXTERNAL_EMOJIS", "EMBED_LINKS", "MANAGE_MESSAGES"],
            description: "See what is currently in the music queue.",
            extendedHelp: "No extended help available."
        });
    }

    async run(msg) {
        const { music } = msg.guild;

        if (!music.playing) return msg.sendMessage(":x: No music is playing.");
        if (!music.queue.length) return msg.sendMessage(":x: There are no songs in the queue.");

        const pages = new RichDisplay(new MessageEmbed()
            .setTitle(`Music Queue`)
            .setDescription(`Here are the tracks currently in the queue:`)
            .setColor("#428bca")
        );

        for (let i = 0; i < music.queue.length; i += 12) {
            const curr = music.queue.slice(i, i + 12);
            pages.addPage(t => t.setDescription(curr.map(y => `\`${music.queue.findIndex(s => s.id === y.id) + 1}\` [${y.title.replace(/\*/g, "\\*")}](${y.url}) (${y.friendlyDuration})`).join("\n")));
        }
        pages.run(await msg.sendMessage(`Loading the queue...`), {
            time: 120000,
            filter: (reaction, user) => user === msg.author
        });
    }

};
