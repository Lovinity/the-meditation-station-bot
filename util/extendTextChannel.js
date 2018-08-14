const { Structures } = require('discord.js');

Structures.extend('TextChannel', TextChannel => class MyChannel extends TextChannel {

    constructor(...args) {
        super(...args);
        this.settings = this.client.gateways.channels.get(`${this.guild.id}-${this.id}`, true);
    }

});

