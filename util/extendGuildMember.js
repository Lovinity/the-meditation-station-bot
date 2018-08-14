const { Structures } = require('discord.js');

Structures.extend('GuildMember', GuildMember => class MyGuildMember extends GuildMember {

    constructor(...args) {
        super(...args);
        this.settings = this.client.gateways.users.get(`${this.id}`, true)[this.guild.id];
    }

});