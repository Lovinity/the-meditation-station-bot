const { Task } = require("klasa");
const { post } = require("snekfetch");
const config = require('../config.js')

const CREDENTIALS = Buffer.from(`${config.spotify.id}:${config.spotify.secret}`).toString("base64");

module.exports = class extends Task {

    async run() {
        if (config.spotify.id === '' || config.spotify.secret === '') return;
        const res = await post(`https://accounts.spotify.com/api/token`, {
            data: {
                grant_type: "client_credentials"
            },
            headers: {
                Authorization: `Basic ${CREDENTIALS}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (res.status !== 200) return;
        this.client.spotifyToken = res.body.access_token;
    }

    init() {
        return this.run();
    }

};
