const { Command, util: { sleep } } = require("klasa");
const { MessageEmbed } = require("discord.js")

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            cooldown: 5,
            aliases: [ "musicplay" ],
            requiredPermissions: [ "USE_EXTERNAL_EMOJIS", "EMBED_LINKS", "ATTACH_FILES" ],
            description: "Add a song into the queue.",
            usage: "<song:songname>",
            extendedHelp: "No extended help available."
        });

        this.requireDJ = true;
    }

    async run (msg, [ songs ]) {
        if (!msg.member) await msg.guild.members.fetch(msg.author.id).catch(() => { throw ":x: Only guild members can use this command."; });

        if (!msg.member.voice.channel) throw "I'm sorry but you need to be in a voice channel to play music!";

        if (!msg.member.voice.channel.joinable) throw "Sorry, but I do not have permission to join your voice channel.";
        if (!msg.member.voice.channel.speakable) throw "I do not have permission to speak in the voice channel, so I cannot play music.";

        const { music } = msg.guild;
        music.textChannel = msg.channel;

        return this.handle(msg, songs);
    }

    async handle (msg, songs) {
        const musicInterface = msg.guild.music;
        try {
            if (!musicInterface.playing) await this.handleSongs(msg, songs);
            else return this.handleSongs(msg, songs);

            await musicInterface.join(msg.member.voice.channel.id);
            return this.play(musicInterface);
        } catch (error) {
            this.client.emit("error", error);
            await musicInterface.textChannel.send(`There was an error: ${error}`);
            return musicInterface.destroy();
        }
    }

    async handleSongs (msg, songs) {
        const musicInterface = msg.guild.music;

        if (songs.tracks.length > 1) {
            const limit = 75;
            const limitedSongs = songs.tracks.slice(0, limit);
            musicInterface.queue.push(...limitedSongs);
            if (songs.tracks.length >= 75) {
                return msg.sendEmbed(this.supportEmbed(songs.playlist));
            } else {
                return msg.send(`ðŸŽ§ | **Queue:** Added **${songs.tracks.length}** songs ${songs.playlist ? `from **${songs.playlist}** ` : ""}to the queue based on your playlist.`);
            }
        } else {
            musicInterface.queue.push(...songs.tracks);
            if (!musicInterface.playing) return;
            musicInterface.playing = true;
            return msg.send(this.queueEmbed(songs.tracks[ 0 ], musicInterface.queue));
        }
    }

    async play (musicInterface) {
        const [ song ] = musicInterface.queue;

        if (!song) {
            if (!musicInterface.textChannel || musicInterface.textChannel.deleted) return musicInterface.destroy();
            await musicInterface.textChannel.send(this.stopEmbed);
            return musicInterface.destroy();
        }

        await sleep(300);

        const player = await musicInterface.play(song.track);
        if (!musicInterface.looping) await musicInterface.textChannel.send(this.playEmbed(song, musicInterface.queue));

        player.once("end", async data => {
            if (data.reason === "REPLACED") return;
            if (!musicInterface.looping) await musicInterface.skip(false);
            await this.play(musicInterface);
        }).once("error", async event => {
            await musicInterface.textChannel.send(`I am very sorry but was an error, please try again.`);
            this.client.emit('error', event.error);
            await musicInterface.destroy();
        });
    }

    playEmbed (song, queue) {
        return new MessageEmbed()
            .setTitle("â¯ | Now Playing")
            .setTimestamp()
            .setColor("#5cb85c")
            .addField("Author", song ? song.author : "No Name", true)
            .addField("Time", song ? song.friendlyDuration : "N/A", true)
            .addField("Songs Left", queue.length ? queue.length - 1 : 0, true)
            .addField("Requested By", song.requester, true)
            .setDescription(`[**${song ? song.title : "No Name"}**](${song.url})`);
    }

    queueEmbed (song, queue) {
        return new MessageEmbed()
            .setTitle("ðŸ—’ | Song Queued")
            .setTimestamp()
            .setColor("#eedc2f")
            .addField("Author", song ? song.author : "No Name", true)
            .addField("Time", song ? song.friendlyDuration : "N/A", true)
            .addField("Queue Position", queue.findIndex(s => s.track === song.track) + 1, true)
            .addField("Requested By", song.requester, true)
            .setDescription(`[**${song ? song.title : "No Name"}**](${song.url})`);
    }

    get stopEmbed () {
        return new MessageEmbed()
            .setTitle("â¹ | Queue Finished")
            .setTimestamp()
            .setColor("#d9534f")
            .setDescription(`â€¢ **Party Over:** All the songs from the queue have finished playing. Leaving voice channel.`);
    }

    supportEmbed (playlistName) {
        return new MessageEmbed()
            .setTitle("Only 75 tracks added.")
            .setColor("#f96854")
            .setDescription(`ðŸŽ§ | **Queue:** Playlist **${playlistName}** has been added to the queue.\n This playlist has more than 75 songs but only 75 were added.`);
    }

};
