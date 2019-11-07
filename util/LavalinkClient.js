const { PlayerManager } = require("discord.js-lavalink");
const fetch = require("./fetch");

class LavalinkClient extends PlayerManager {

    constructor(...args) {
        super(...args);
    }

    resolveTracks(identifier) {
        const node = this.nodes.first();
        return fetch(`http://${node.host}:${node.port}/loadtracks`, { query: { identifier }, headers: { Authorization: node.password } })
            .catch(error => {
                Error.captureStackTrace(error);
                this.client.emit("error", error);
                throw error;
            });
    }

}

module.exports = LavalinkClient;
