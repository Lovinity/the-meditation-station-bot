const { Client } = require('klasa');
const config = require('./config.js');

new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    prefix: '!',
    commandEditing: true,
    typing: true,
    providers: {
        default: 'json'
    },
    readyMessage: (client) => `Ready to serve ${client.guilds.size} guilds and ${client.users.size} users`
}).login(config.botToken);