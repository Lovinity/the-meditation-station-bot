const { Command } = require("klasa");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 10,
            requiredPermissions: ["USE_EXTERNAL_EMOJIS", "EMBED_LINKS"],
            description: "Get information on how to use the music commands.",
            extendedHelp: "No extended help available."
        });
    }

    async run(msg) {
        const embed = new MessageEmbed()
            .setColor("#91c3d2")
            .setTitle("ðŸŽµ | Music Help")
            .setTimestamp()
            .setDescription("Enjoy live music in the guild!")
            .addField(`â€¢ play`, "For Song Selector Use: `play <Song Name>`, For Playlists, YouTube Video URLs, Soundcloud URLs, Live Streams, etc. use `play <URL>`, for SoundCloud Search or YouTube Search use: `play <ytsearch|scsearch>:<song name>`.") // eslint-disable-line max-len
            .addField(`â€¢ stop`, "Stops the music and clears the queue. If DJ mode is on, only a DJ can use this command.")
            .addField(`â€¢ skip`, "Skip the current song instantly if there are 3 or less people in the voice channel. It does a vote skip if there are more people. If DJ mode is on, only a DJ can use this command.")
            .addField(`â€¢ pause`, "Pause the music. If DJ mode is on, only a DJ can use this command.")
            .addField(`â€¢ resume`, "Resume the paused music. If DJ mode is on, only a DJ can use this command.")
            .addField(`â€¢ queue`, "Tells you which all songs are in the queue with more information.")
            .addField(`â€¢ nowplaying`, "Get information about the currently playing song.")
            .addField(`â€¢ dmsong`, "Direct Messages you the information about the currently playing song.")
            .addField(`â€¢ managedj`, "Tag a user to make them a DJ. Only staff may use this command.")
            .addField(`â€¢ loop`, "Loop a song to repeat everytime it finishes.")
            .addField(`â€¢ toggledj`, "If activated, only DJs may use certain commands. If disabled, everyone can use those commands. Only staff can toggle this.")
            .addField(`â€¢ shuffle`, "Shuffle the song queue to randomize it.")
            .addField(`â€¢ volume`, "Change my volume in Voice Channel.")

        return msg.sendEmbed(embed);
    }

};