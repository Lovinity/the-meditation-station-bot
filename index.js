const { Client } = require('klasa');

new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    prefix: '!',
    cmdEditing: true,
    typing: true,
    readyMessage: (client) => `${client.user.tag}, Ready to serve ${client.guilds.size} guilds and ${client.users.size} users`
}).login('NDc4MDYyODEyNjIzNzk4Mjgy.DlKnHQ.0eGxaSvNk4Yszvs078r1R3kjjwk');