const { Argument, util: { showSeconds } } = require("klasa");
const Song = require("../util/Song")
const config = require("../config.js")

const wildcard = /(?:scsearch:|ytsearch:).*/i;
const yt = /^(http(s)?:\/\/)?((w){3}.|music.)?youtu(be|.be)?(\.com)?\/.+/;
const spotifyList = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|user\/spotify\/playlist\/|\?uri=spotify:playlist:)([1-z]{22})/i;
const spotifyAlbum = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/i;
const spotifyTrack = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/i;

module.exports = class extends Argument {

    async run(arg, possible, msg) {
        if (!arg) throw `${this.client.emotes.cross} ***Please enter a link, word, artist name, song name, etc. to play.***`;
        arg = arg.replace(/<(.+)>/g, "$1");
        if (!msg.guild) return null;

        const results = [];
        results.playlist = null;

        const validLink = this.isLink(arg);
        if (validLink) {
            if (yt.test(arg) && !this.client.patreon) throw `> ${this.client.emotes.cross} ***Due to recent change in YouTube's API, all Discord Bots and similar services are unable to play any YouTube videos/streams normally.***`;
            const result = await this.validLinkSearch(msg, arg);
            if (result.tracks.length) {
                results.push(...result.tracks);
                if (result.playlist) results.playlist = result.playlist;
            }
        }

        if (wildcard.test(arg) && !validLink) {
            const res = await this.wildcardTrack(msg, arg);
            results.push(res);
        }

        if (!validLink) {
            const res = await this.searchTrack(msg, arg);
            results.push(res);
        }

        if (!results.length) throw ":x: Sorry, I could not find any music with your search.";
        return { tracks: results.map(track => new Song(track, msg.author)), playlist: results.playlist };
    }

    validLinkSearch(msg, arg) {
        if (spotifyTrack.test(arg)) return this.spotifyTrack(msg, arg);
        if (spotifyList.test(arg)) return this.spotifyPlaylist(msg, arg);
        if (spotifyAlbum.test(arg)) return this.spotifyAlbum(msg, arg);

        return this.fetchTracks(arg);
    }

    async searchTrack(msg, arg) {
        const data = await this.fetchTracks(`scsearch:${arg}`);
        if (!data || !data.tracks.length) throw ":x: Sorry, I could not find any music with your search.";

        const songs = data.tracks.slice(0, 5);

        const selectionMessage = await msg.prompt(`
🎵 | **Select a Song**
${songs.map((song, index) => `➡ \`${++index}\` ${song.info.title} - ${song.info.author} (${showSeconds(song.info.length)})`).join("\n")}
${msg.author}, Please select a track by replying from range \`1-5\` to add it to the queue.`, 60000);

        const selection = Number(selectionMessage.content);
        if (isNaN(selection) || selection < 1 || selection > 5) throw `${this.client.emotes.cross} ***Invalid Option Selected, please select one number between \`1-5\`. Cancelled song selection.***`;

        if (!songs[selection - 1]) throw `${this.client.emotes.cross} ***Specified track could not be found, please try again with a different one.***`;
        return songs[selection - 1];
    }

    async wildcardTrack(msg, arg) {
        const data = await this.fetchTracks(wildcard.exec(arg)[0]);
        if (!data || !data.tracks.length) throw ":x: Sorry, I could not find any music with your search.";

        return data.tracks[0];
    }

    async spotifyPlaylist(msg, arg) {
        if (this.client.spotifyToken === '') throw ":x: Sorry, but a Spotify API key has not been set up."
        const data = await this.fetchURL(`https://api.spotify.com/v1/playlists/${spotifyList.exec(arg)[1]}`,
            { headers: { Authorization: `Bearer ${this.client.spotifyToken}` } });
        if (!data) throw ":x: Sorry, I could not find any music with your search.";

        const loading = await msg.sendMessage(`${this.client.emotes.loading} ***Spotify Playlist is Loading...***`);
        const tracks = [];

        for (const { track } of data.tracks.items) {
            const searchResult = await this.fetchTracks(`scsearch:${track.album.artists[0].name || track.artists[0].name} ${track.name} audio`);
            if (!searchResult.tracks.length) continue;
            tracks.push(searchResult.tracks[0]);
        }

        await loading.delete().catch(() => null);
        return { tracks, playlist: data.name };
    }

    async spotifyTrack(msg, arg) {
        if (this.client.spotifyToken === '') throw ":x: Sorry, but a Spotify API key has not been set up."
        const data = await this.fetchURL(`https://api.spotify.com/v1/tracks/${spotifyTrack.exec(arg)[1]}`,
            { headers: { Authorization: `Bearer ${this.client.spotifyToken}` } });
        if (!data) throw ":x: Sorry, I could not find any music with your search.";

        const [artist] = data.artists;

        const searchResult = await this.fetchTracks(`scsearch:${artist ? artist.name : ""} ${data.name} audio`);
        if (!searchResult.tracks.length) throw ":x: Sorry, I could not find any music with your search.";

        return { tracks: [searchResult.tracks[0]] };
    }

    async spotifyAlbum(msg, arg) {
        if (this.client.spotifyToken === '') throw ":x: Sorry, but a Spotify API key has not been set up."
        const data = await this.fetchURL(`https://api.spotify.com/v1/albums/${spotifyAlbum.exec(arg)[1]}`,
            { headers: { Authorization: `Bearer ${this.client.spotifyToken}` } });
        if (!data) throw ":x: Sorry, I could not find any music with your search.";

        const loading = await msg.sendMessage(`${this.client.emotes.loading} ***Spotify Album is Loading...***`);
        const tracks = [];

        for (const track of data.tracks.items) {
            const searchResult = await this.fetchTracks(`scsearch:${track.artists[0].name} ${track.name} audio`);
            if (!searchResult.tracks.length) continue;
            tracks.push(searchResult.tracks[0]);
        }

        await loading.delete().catch(() => null);
        return { tracks, playlist: data.name };
    }

    async fetchTracks(search) {
        console.log(search)
        const result = await this.client.lavalink.resolveTracks(search);
        console.dir(result)

        if (result.loadType === "LOAD_FAILED") throw "There was an error trying to search for that song";
        return { tracks: result.tracks, playlist: "name" in result.playlistInfo ? result.playlistInfo.name : null };
    }

    isLink(arg) {
        try {
            new URL(arg); // eslint-disable-line no-new
            return true;
        } catch (e) {
            return false;
        }
    }

};