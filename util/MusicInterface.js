class MusicInterface {

    constructor(guild) {
        Object.defineProperty(this, "client", { value: guild.client });
        Object.defineProperty(this, "guild", { value: guild });

        this.textChannel = null;
        this.queue = [];
        this.playing = false;
        this.paused = false;
        this.looping = false;
    }

    join(voiceChannel) {
        if (!this.idealNode) throw new Error(":x: NO_NODES_AVAILABLE: There are no nodes available to use.");
        return this.client.lavalink.join({
            guild: this.guild.id,
            channel: voiceChannel,
            host: this.idealNode.host
        }, { selfdeaf: true });
    }

    async leave() {
        await this.client.lavalink.leave(this.guild.id);
        this.playing = false;
    }

    async play() {
        if (!this.player) throw ":x: Something went wrong, try again.";
        else if (!this.queue.length) throw ":x: Can't play songs from an empty queue. Queue up some songs!";

        const [song] = this.queue;
        const volume = { volume: this.volume };

        await this.player.play(song.track, volume);

        this.playing = true;
        return this.player;
    }

    async skip(force = true) {
        if (this.player && force) await this.player.stop();
        else this.queue.shift();
    }


    async pause() {
        if (!this.player) return null;
        const paused = !this.paused;
        await this.player.pause(paused);
        this.paused = paused;
        return paused;
    }

    async setVolume(volume) {
        await this.guild.settings.update("music.volume", volume);
        if (this.playing) await this.player.volume(volume);
        return volume;
    }

    clearQueue() {
        this.queue = [];
        return this;
    }

    async destroy() {
        this.queue = null;
        this.playing = null;
        this.paused = null;
        this.textChannel = null;
        this.looping = null;

        if (this.player) await this.player.destroy();
        await this.leave();
        this.client.music.delete(this.guild.id);
    }

    get voiceChannel() {
        return this.guild.me ? this.guild.me.voice.channel : null;
    }

    get player() {
        return this.client.lavalink.players.get(this.guild.id) || null;
    }

    get volume() {
        return this.guild.settings.get("music.volume");
    }

    get idealNode() {
        return this.client.lavalink.idealNodes.first() || null;
    }

}

module.exports = MusicInterface;