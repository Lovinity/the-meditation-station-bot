const { Collection } = require("discord.js");
const MusicInterface = require("./MusicInterface");

class MusicManager extends Collection {

    add(guild) {
        if (guild && this.has(guild.id)) return this.get(guild.id);
        const guildInterface = new MusicInterface(guild);
        this.set(guild.id, guildInterface);
        return guildInterface;
    }

}

module.exports = MusicManager;
