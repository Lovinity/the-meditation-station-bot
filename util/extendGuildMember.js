const { Structures } = require('discord.js');

Structures.extend('GuildMember', GuildMember => class MyGuildMember extends GuildMember {

    constructor(...args) {
        super(...args);
        this.settings = this.client.gateways.users.get(`${this.id}`, true)[this.guild.id];
        this.settings.update = (key, data, options = {}) => {
            return this.user.settings.update(`${this.guild.id}.${key}`, data, options);
        };
        this.settings.reset = (key) => {
            return this.user.settings.reset(`${this.guild.id}.${key}`);
        };
    }

});